import {Window} from 'hadouken-js-adapter';
import {ApplicationInfo} from 'hadouken-js-adapter/out/types/src/api/application/application';
import {WindowDetail, WindowInfo as WindowInfo_System} from 'hadouken-js-adapter/out/types/src/api/system/window';
import {WindowInfo as WindowInfo_Window} from 'hadouken-js-adapter/out/types/src/api/window/window';
import {Identity} from 'hadouken-js-adapter/out/types/src/identity';

import {WorkspaceAPI} from '../../client/internal';
import {CustomData, TabGroup, WindowState, Workspace, WorkspaceApp, WorkspaceGeneratedEvent, WorkspaceWindow} from '../../client/workspaces';
import {EVENT_CHANNEL_TOPIC} from '../APIMessages';
import {apiHandler, model, tabService} from '../main';
import {WindowIdentity} from '../model/DesktopWindow';
import {promiseMap} from '../snapanddock/utils/async';

import {getGroup} from './group';
import {addToWindowObject, adjustSizeOfFormerlyTabbedWindows, canRestoreProgrammatically, inWindowObject, parseVersionString, wasCreatedFromManifest, WindowObject} from './utils';

// This value should be updated any time changes are made to the Workspace schema.
// Major version indicates breaking changes.
export const LAYOUTS_SCHEMA_VERSION = '1.0.0';
export const SCHEMA_MAJOR_VERSION = parseVersionString(LAYOUTS_SCHEMA_VERSION).major;

/**
 * A subset of LayoutWindow, should refactor to remove the need to duplicate this.
 */
interface WorkspaceWindowData {
    uuid: string;
    isShowing: boolean;
    state: WindowState;
    frame: boolean;
    info: WindowInfo_Window;
    windowGroup: Identity[];
    isTabbed: boolean;
}

export const getCurrentWorkspace = async(): Promise<Workspace> => {
    // Not yet using monitor info
    const monitorInfo = await fin.System.getMonitorInfo() || {};
    let tabGroups = await tabService.getTabSaveInfo();
    const tabbedWindows: WindowObject = {};
    const formerlyTabbedWindows: WindowObject = {};

    if (tabGroups === undefined) {
        tabGroups = [];
    }

    // Filter out tabGroups with deregistered parents.
    const filteredTabGroups: TabGroup[] = [];

    tabGroups.forEach((tabGroup: TabGroup) => {
        const filteredTabs: WindowIdentity[] = [];
        let activeWindowRemoved = false;

        tabGroup.tabs.forEach((tabWindow: WindowIdentity) => {
            // Filter tabs out if either the window itself or its parent is deregistered from Save and Restore
            const parentIsDeregistered = !model.getWindow({uuid: tabWindow.uuid, name: tabWindow.uuid});

            if (parentIsDeregistered) {
                if (tabGroup.groupInfo.active.uuid === tabWindow.uuid && tabGroup.groupInfo.active.name === tabWindow.name) {
                    activeWindowRemoved = true;
                }
            } else {
                filteredTabs.push(tabWindow);
            }
        });

        // If the active window was removed, set a new window from the group to show
        if (activeWindowRemoved && filteredTabs.length >= 1) {
            const newActiveWindow = filteredTabs[0];
            tabGroup.groupInfo.active = newActiveWindow;
        }

        // If we still have enough windows for a tab group, include it in filteredTabGroups
        if (filteredTabs.length > 1) {
            filteredTabGroups.push({groupInfo: tabGroup.groupInfo, tabs: filteredTabs});
        } else if (filteredTabs.length === 1) {
            addToWindowObject(filteredTabs[0], formerlyTabbedWindows);
        }
    });

    // Populate the tabbedWindows object for easy lookup
    filteredTabGroups.forEach((tabGroup) => {
        tabGroup.tabs.forEach(tabWindow => {
            addToWindowObject(tabWindow, tabbedWindows);
        });
    });

    const apps = await fin.System.getAllWindows();
    const layoutApps: (WorkspaceApp|null)[] = await promiseMap<WindowInfo_System, WorkspaceApp|null>(apps, async (windowInfo: WindowInfo_System) => {
        try {
            const {uuid} = windowInfo;
            const ofApp = await fin.Application.wrap({uuid});

            // If not running, or is service, or is deregistered, not part of layout
            const isRunning = await ofApp.isRunning();
            const hasMainWindow = !!windowInfo.mainWindow.name;
            const isDeregistered = !model.getWindow({uuid, name: windowInfo.mainWindow.name});
            const isService = uuid === fin.Application.me.uuid;
            if (!hasMainWindow || !isRunning || isService || isDeregistered) {
                // Not enough info returned for us to restore this app
                return null;
            }

            const appInfo: ApplicationInfo = await ofApp.getInfo().catch((e: Error) => {
                console.log('Appinfo Error', e);
                return {} as ApplicationInfo;
            });

            // Grab the layout information for the main app window
            const mainOfWin: Window = await ofApp.getWindow();
            const mainWindowLayoutData = await getWorkspaceWindowData(mainOfWin, tabbedWindows);
            const mainWindow: WorkspaceWindow = {...windowInfo.mainWindow, ...mainWindowLayoutData};
            const mainWinIdentity = {uuid, name: mainWindow.name};
            adjustSizeOfFormerlyTabbedWindows(mainWinIdentity, formerlyTabbedWindows, mainWindow);

            // Filter for deregistered child windows
            windowInfo.childWindows = windowInfo.childWindows.filter((win: WindowDetail) => {
                return model.getWindow({uuid, name: win.name}) !== null;
            });

            // Grab the layout information for the child windows
            const childWindows: WorkspaceWindow[] = await promiseMap(windowInfo.childWindows, async (childWin: WindowDetail) => {
                const {name} = childWin;
                const childWinIdentity = {uuid, name};
                const ofWin = fin.Window.wrapSync(childWinIdentity);
                const windowLayoutData = await getWorkspaceWindowData(ofWin, tabbedWindows);
                adjustSizeOfFormerlyTabbedWindows(childWinIdentity, formerlyTabbedWindows, childWin);

                return {...childWin, ...windowLayoutData};
            });
            if (wasCreatedFromManifest(appInfo, uuid)) {
                delete appInfo.manifest;
                return {mainWindow, childWindows, ...appInfo, uuid, confirmed: false} as WorkspaceApp;
            } else if (canRestoreProgrammatically(appInfo)) {
                delete appInfo.manifest;
                delete appInfo.manifestUrl;
                return {mainWindow, childWindows, ...appInfo, uuid, confirmed: false} as WorkspaceApp;
            } else {
                console.error('Not saving app, cannot restore:', windowInfo);
                return null;
            }
        } catch (e) {
            console.error('Error adding app to layout', windowInfo, e);
            return null;
        }
    });
    const validApps: WorkspaceApp[] = layoutApps.filter((a): a is WorkspaceApp => !!a);
    console.log('Pre-Layout Save Apps:', apps);
    console.log('Post-Layout Valid Apps:', validApps);

    const layoutObject: Workspace = {type: 'layout', schemaVersion: LAYOUTS_SCHEMA_VERSION, apps: validApps, monitorInfo, tabGroups: filteredTabGroups};

    const event: WorkspaceGeneratedEvent = {type: 'workspace-generated', workspace: layoutObject};
    apiHandler.sendToAll(EVENT_CHANNEL_TOPIC, event);

    return layoutObject;
};

// No payload. Just returns the current layout with child windows.
export const generateWorkspace = async(payload: null, identity: Identity): Promise<Workspace> => {
    const preLayout = await getCurrentWorkspace();

    const apps = await promiseMap(preLayout.apps, async (app: WorkspaceApp) => {
        const defaultResponse = {...app};
        if (apiHandler.isClientConnection({uuid: app.uuid, name: app.mainWindow.name})) {
            console.log('Connected application', app.uuid);

            // HOW TO DEAL WITH HUNG REQUEST HERE? RESHAPE IF GET NOTHING BACK?
            let customData: CustomData = undefined;

            customData =
                await apiHandler.sendToClient<WorkspaceAPI.GENERATE_HANDLER, CustomData>({uuid: app.uuid, name: app.uuid}, WorkspaceAPI.GENERATE_HANDLER, app);

            if (!customData) {
                customData = null;
            }
            defaultResponse.customData = customData;
            defaultResponse.confirmed = true;
            return defaultResponse;
        } else {
            return defaultResponse;
        }
    });

    const confirmedLayout = {...preLayout, apps};
    return confirmedLayout;
};

// Grabs all of the necessary layout information for a window. Filters by multiple criteria.
const getWorkspaceWindowData = async(ofWin: Window, tabbedWindows: WindowObject): Promise<WorkspaceWindowData> => {
    const {uuid} = ofWin.identity;
    const identity: WindowIdentity = ofWin.identity as WindowIdentity;
    const info = await ofWin.getInfo();

    const windowGroup = await getGroup(ofWin.identity);
    const filteredWindowGroup: Identity[] = [];
    windowGroup.forEach((windowIdentity) => {
        // Filter window group by checking to see if the window itself or its parent are deregistered. If either of them are, don't include in window group.
        const parentIsRegistered = !!model.getWindow({uuid: windowIdentity.uuid, name: windowIdentity.uuid});
        const windowIsRegistered = !!model.getWindow(windowIdentity as WindowIdentity);
        if (parentIsRegistered && windowIsRegistered && windowIdentity.uuid !== 'layouts-service') {
            filteredWindowGroup.push(windowIdentity);
        }
    });

    const desktopWindow = model.getWindow(identity);
    if (desktopWindow === null) {
        throw Error(`No desktop window for window. Name: ${identity.name}, UUID: ${identity.uuid}`);
    }
    const applicationState = desktopWindow.applicationState;

    // If a window is tabbed (based on filtered tabGroups), tab it.
    const isTabbed = inWindowObject(ofWin.identity, tabbedWindows) ? true : false;

    const state = desktopWindow.currentState.state;

    return {info, uuid, windowGroup: filteredWindowGroup, frame: applicationState.frame, state, isTabbed, isShowing: !applicationState.hidden};
};
