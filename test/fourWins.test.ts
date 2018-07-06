import { test } from 'ava';

import { getConnection } from './utils/connect';
import { dragWindowTo } from './utils/dragWindowTo';
import { getBounds, NormalizedBounds } from './utils/getBounds';
import { Win } from './utils/getWindow';
import { Application, Fin } from 'hadouken-js-adapter';
import * as robot from 'robotjs';
import { resizeWindowToSize } from './utils/resizeWindowToSize';
import { createChildWindow } from './utils/createChildWindow';

test('inner horizontal resize', async t => {
    let win1 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 0, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win2 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 250, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win3 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 500, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win4 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 750, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });

    let win1Bounds = await getBounds(win1);
    let win2Bounds = await getBounds(win2);
    let win3Bounds = await getBounds(win3);
    let win4Bounds = await getBounds(win4);

    const firstRowExpectedWidth = (win1Bounds.right - win1Bounds.left) + (win2Bounds.right - win2Bounds.left);
    const secondRowExpectedWidth = (win3Bounds.right - win3Bounds.left) + (win4Bounds.right - win4Bounds.left);

    await dragWindowTo(win2, win1Bounds.right + 2, win1Bounds.top);
    await dragWindowTo(win3, win1Bounds.left, win1Bounds.bottom + 2);
    await dragWindowTo(win4, win3Bounds.right + 2, win1Bounds.bottom + 2);

    robot.moveMouse(win1Bounds.right, (win1Bounds.top + win1Bounds.bottom) / 2);
    robot.mouseToggle('down');
    robot.moveMouse(win1Bounds.right + 50, (win1Bounds.top + win1Bounds.bottom) / 2);
    robot.mouseToggle('up');

    win1Bounds = await getBounds(win1);
    win2Bounds = await getBounds(win2);
    win3Bounds = await getBounds(win3);
    win4Bounds = await getBounds(win4);

    const firstRowActualWidth = (win1Bounds.right - win1Bounds.left) + (win2Bounds.right - win2Bounds.left);
    const secondRowActualWidth = (win3Bounds.right - win3Bounds.left) + (win4Bounds.right - win4Bounds.left);

    t.is(firstRowActualWidth, firstRowExpectedWidth);
    t.is(secondRowActualWidth, secondRowExpectedWidth);
    await win1.close();
    await win2.close();
    await win3.close();
    await win4.close();
});

test('inner vertical resize', async t => {
    let win1 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 0, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win2 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 250, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win3 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 500, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win4 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 750, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });

    let win1Bounds = await getBounds(win1);
    let win2Bounds = await getBounds(win2);
    let win3Bounds = await getBounds(win3);
    let win4Bounds = await getBounds(win4);

    const firstColumnExpectedHeight = (win1Bounds.bottom - win1Bounds.top) + (win3Bounds.bottom - win3Bounds.top);
    const secondColumnExpectedHeight = (win2Bounds.bottom - win2Bounds.top) + (win4Bounds.bottom - win4Bounds.top);

    await dragWindowTo(win2, win1Bounds.right + 2, win1Bounds.top);
    await dragWindowTo(win3, win1Bounds.left, win1Bounds.bottom + 2);
    await dragWindowTo(win4, win3Bounds.right + 2, win1Bounds.bottom + 2);

    robot.moveMouse((win1Bounds.left + win1Bounds.right) / 2, win1Bounds.bottom);
    robot.mouseToggle('down');
    robot.moveMouseSmooth((win1Bounds.left + win1Bounds.right) / 2, win1Bounds.bottom + 20);
    robot.mouseToggle('up');

    win1Bounds = await getBounds(win1);
    win2Bounds = await getBounds(win2);
    win3Bounds = await getBounds(win3);
    win4Bounds = await getBounds(win4);

    const firstColumnActualHeight = (win1Bounds.bottom - win1Bounds.top) + (win3Bounds.bottom - win3Bounds.top);
    const secondColumnActualHeight = (win2Bounds.bottom - win2Bounds.top) + (win4Bounds.bottom - win4Bounds.top);

    t.is(firstColumnActualHeight, firstColumnExpectedHeight);
    t.is(secondColumnActualHeight, secondColumnExpectedHeight);
    await win1.close();
    await win2.close();
    await win3.close();
    await win4.close();
});

test('outer vertical resize', async t => {
    let win1 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 0, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win2 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 250, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win3 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 500, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win4 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 750, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });

    let win1Bounds = await getBounds(win1);
    let win2Bounds = await getBounds(win2);
    let win3Bounds = await getBounds(win3);
    let win4Bounds = await getBounds(win4);

    const diff = 20;

    const win1ExpectedHeight = win1Bounds.bottom - win1Bounds.top;
    const win2ExpectedHeight = win2Bounds.bottom - win2Bounds.top;
    const win3ExpectedHeight = win3Bounds.bottom - win3Bounds.top + diff;
    const win4ExpectedHeight = win4Bounds.bottom - win4Bounds.top + diff;

    await dragWindowTo(win2, win1Bounds.right + 2, win1Bounds.top);
    await dragWindowTo(win3, win1Bounds.left, win1Bounds.bottom + 2);
    await dragWindowTo(win4, win3Bounds.right + 2, win1Bounds.bottom + 2);

    win3Bounds = await getBounds(win3);

    robot.moveMouse((win3Bounds.left + win3Bounds.right) / 2, win3Bounds.bottom - 2);
    robot.mouseToggle('down');
    robot.moveMouseSmooth((win3Bounds.left + win3Bounds.right) / 2, win3Bounds.bottom + diff);
    robot.mouseToggle('up');

    win1Bounds = await getBounds(win1);
    win2Bounds = await getBounds(win2);
    win3Bounds = await getBounds(win3);
    win4Bounds = await getBounds(win4);

    let heights = [win1Bounds, win2Bounds, win3Bounds, win4Bounds].map((bounds) => bounds.bottom - bounds.top);
    t.is(heights[0], win1ExpectedHeight);
    t.is(heights[1], win2ExpectedHeight);
    t.is(heights[2], win3ExpectedHeight);
    t.is(heights[3], win4ExpectedHeight);

    await win1.close();
    await win2.close();
    await win3.close();
    await win4.close();
});


const width = (bounds: NormalizedBounds) => {
    return bounds.right - bounds.left;
};

const height = (bounds: NormalizedBounds) => {
    return bounds.bottom - bounds.top;
};

test('outer horizontal resize', async t => {
    let win1 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 0, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win2 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 250, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win3 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 500, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win4 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 750, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });

    let win1Bounds = await getBounds(win1);
    let win2Bounds = await getBounds(win2);
    let win3Bounds = await getBounds(win3);
    let win4Bounds = await getBounds(win4);

    const diff = 50;

    const win1ExpectedWidth = win1Bounds.right - win1Bounds.left;
    const win2ExpectedWidth = win2Bounds.right - win2Bounds.left + diff;
    const win3ExpectedWidth = win3Bounds.right - win3Bounds.left;
    const win4ExpectedWidth = win4Bounds.right - win4Bounds.left + diff;

    await dragWindowTo(win2, win1Bounds.right + 2, win1Bounds.top);
    await dragWindowTo(win3, win1Bounds.left, win1Bounds.bottom + 2);
    await dragWindowTo(win4, win3Bounds.right + 2, win1Bounds.bottom + 2);

    win2Bounds = await getBounds(win2);

    robot.moveMouse(win2Bounds.right - 2, (win2Bounds.top + win2Bounds.bottom) / 2);
    robot.mouseToggle('down');
    robot.moveMouseSmooth(win2Bounds.right + diff, (win2Bounds.top + win2Bounds.bottom) / 2);
    robot.mouseToggle('up');

    win1Bounds = await getBounds(win1);
    win2Bounds = await getBounds(win2);
    win3Bounds = await getBounds(win3);
    win4Bounds = await getBounds(win4);

    let widths = [win1Bounds, win2Bounds, win3Bounds, win4Bounds].map((bounds) => bounds.right - bounds.left);
    t.is(widths[0], win1ExpectedWidth);
    t.is(widths[1], win2ExpectedWidth);
    t.is(widths[2], win3ExpectedWidth);
    t.is(widths[3], win4ExpectedWidth);

    await win1.close();
    await win2.close();
    await win3.close();
    await win4.close();
});

test('inner diagonal resize', async t => {
    let win1 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 0, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win2 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 250, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win3 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 500, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win4 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 750, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });

    let win1Bounds = await getBounds(win1);
    let win2Bounds = await getBounds(win2);
    let win3Bounds = await getBounds(win3);
    let win4Bounds = await getBounds(win4);

    const yDiff = 50;
    const xDiff = 30;

    const expectedWidths = [width(win1Bounds) - xDiff, width(win2Bounds) + xDiff, width(win3Bounds) - xDiff, width(win4Bounds) + xDiff];
    const expectedHeights = [height(win1Bounds) - yDiff, height(win2Bounds) - yDiff, height(win3Bounds) + yDiff, height(win4Bounds) + yDiff];

    await dragWindowTo(win2, win1Bounds.right + 2, win1Bounds.top);
    await dragWindowTo(win3, win1Bounds.left, win1Bounds.bottom + 2);
    await dragWindowTo(win4, win3Bounds.right + 2, win1Bounds.bottom + 2);

    win1Bounds = await getBounds(win1);

    robot.moveMouse(win1Bounds.right - 2, win1Bounds.bottom - 2);
    robot.mouseToggle('down');
    robot.moveMouseSmooth(win1Bounds.right - 2 - xDiff, win1Bounds.bottom - 2 - yDiff);
    robot.mouseToggle('up');

    win1Bounds = await getBounds(win1);
    win2Bounds = await getBounds(win2);
    win3Bounds = await getBounds(win3);
    win4Bounds = await getBounds(win4);

    let widths = [win1Bounds, win2Bounds, win3Bounds, win4Bounds].map((bounds) => width(bounds));
    let heights = [win1Bounds, win2Bounds, win3Bounds, win4Bounds].map((bounds) => height(bounds));
    widths.forEach((w, i) => {
        // height off by 1 in windows 7, needs to be tested in Win 10
        t.is(Math.abs(w - expectedWidths[i]) < 2, true);
        t.is(Math.abs(heights[i] - expectedHeights[i]) < 2, true);
    });

    await win1.close();
    await win2.close();
    await win3.close();
    await win4.close();
});

test('group moving', async t => {
    let win1 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 0, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win2 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 250, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win3 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 500, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    let win4 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 750, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });

    let win1Bounds = await getBounds(win1);
    let win2Bounds = await getBounds(win2);
    let win3Bounds = await getBounds(win3);
    let win4Bounds = await getBounds(win4);

    await dragWindowTo(win2, win1Bounds.right + 2, win1Bounds.top);
    await dragWindowTo(win3, win1Bounds.left, win1Bounds.bottom + 2);
    await dragWindowTo(win4, win3Bounds.right + 2, win1Bounds.bottom + 2);
    win1Bounds = await getBounds(win1);
    win2Bounds = await getBounds(win2);
    win3Bounds = await getBounds(win3);
    win4Bounds = await getBounds(win4);


    // drag the group with mouse

    const diff = 100;
    let expectedLeftCoords = [win1Bounds, win2Bounds, win3Bounds, win4Bounds].map(bounds => bounds.left + diff);
    let expectedTopCoords = [win1Bounds, win2Bounds, win3Bounds, win4Bounds].map(bounds => bounds.top + diff);

    await dragWindowTo(win1, win1Bounds.left + diff, win1Bounds.top + diff);
    await new Promise(res => setTimeout(res, 2000));

    win1Bounds = await getBounds(win1);
    win2Bounds = await getBounds(win2);
    win3Bounds = await getBounds(win3);
    win4Bounds = await getBounds(win4);

    let actualLeftCoords = [win1Bounds, win2Bounds, win3Bounds, win4Bounds].map(bounds => bounds.left);
    let actualTopCoords = [win1Bounds, win2Bounds, win3Bounds, win4Bounds].map(bounds => bounds.top);

    actualLeftCoords.forEach((lCoord, i) => {
        // offset of 1px on Windows 7, needs to be tested on Win 10
        t.is(Math.abs(lCoord - expectedLeftCoords[i]) < 2, true);
        console.log(actualTopCoords[i], expectedTopCoords[i]);
        t.is(Math.abs(actualTopCoords[i] - expectedTopCoords[i]) < 2, true);
    });

    await win1.close();
    await win2.close();
    await win3.close();
    await win4.close();
});