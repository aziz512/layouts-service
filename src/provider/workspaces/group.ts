import {Identity} from 'hadouken-js-adapter/out/types/src/identity';

import {WorkspaceApp, WorkspaceWindow} from '../../client/workspaces';
import {model} from '../main';
import {WindowIdentity} from '../model/DesktopWindow';
import {promiseMap} from '../snapanddock/utils/async';

export const getGroup = (identity: Identity): Promise<Identity[]> => {
    const {uuid, name} = identity;
    const ofWin = fin.desktop.Window.wrap(uuid, name!);
    // v2api getgroup broken
    return new Promise((res, rej) => {
        ofWin.getGroup((group: fin.OpenFinWindow[]) => {
            const groupIds = group
                                 .map((win: fin.OpenFinWindow) => {
                                     return {uuid: win.uuid, name: win.name};
                                 })
                                 .filter((id: Identity) => {
                                     return id.uuid !== uuid || id.name !== name;
                                 });
            res(groupIds);
            return;
        }, () => res([]));
    });
};

export const regroupWorkspace = async (apps: WorkspaceApp[]) => {
    await promiseMap(apps, async(app: WorkspaceApp): Promise<void> => {
        await groupWindow(app.mainWindow);
        await promiseMap(app.childWindows, async (child: WorkspaceWindow) => {
            await groupWindow(child);
        });
    });
};

export const groupWindow = async (win: WorkspaceWindow) => {
    await promiseMap(win.windowGroup, async (w: Identity) => {
        if (w.uuid === 'layouts-service') {
            return;
        }

        // If window has a tabGroup, we should group it instead of the window itself.
        const targetEntity = await model.expect(win as WindowIdentity).then(w => w.tabGroup || w);
        const curEntity = await model.expect(w as WindowIdentity).then(w => w.tabGroup || w);

        if (curEntity.snapGroup.id !== targetEntity.snapGroup.id) {
            await curEntity.setSnapGroup(targetEntity.snapGroup);
        }
    });
};