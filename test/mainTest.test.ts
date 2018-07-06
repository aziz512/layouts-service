import { test } from 'ava';
import { dragWindowTo } from './utils/dragWindowTo';
import { getBounds } from './utils/getBounds';
import * as robot from 'robotjs';
import { resizeWindowToSize } from './utils/resizeWindowToSize';
import { createChildWindow } from './utils/createChildWindow';
import { _Window } from 'hadouken-js-adapter/out/types/src/api/window/window';

let win1: _Window, win2: _Window;
test.beforeEach(async () => {
    win1 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 100, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200 });
    win2 = await createChildWindow({ autoShow: true, saveWindowState: false, defaultTop: 300, defaultLeft: 400, defaultHeight: 200, defaultWidth: 200 });
});
test.afterEach.always(async () => {
    await win1.close();
    await win2.close();
});

test('bottom', async t => {
    const win2Bounds = await getBounds(win2);

    await dragWindowTo(win1, win2Bounds.left + 50, win2Bounds.bottom + 2);
    await dragWindowTo(win2, 500, 500);

    const bounds1 = await getBounds(win1);
    const bounds2 = await getBounds(win2);

    t.is(bounds1.left, bounds2.left);
    t.is(bounds1.top, bounds2.bottom);
});

test('top', async t => {
    const win2Bounds = await getBounds(win2);

    await dragWindowTo(win1, win2Bounds.left + 50, win2Bounds.top - (win2Bounds.bottom - win2Bounds.top + 2));
    await dragWindowTo(win2, 500, 500);

    const bounds1 = await getBounds(win1);
    const bounds2 = await getBounds(win2);

    t.is(bounds1.left, bounds2.left);
    t.is(bounds1.bottom, bounds2.top);
});

test('left', async t => {
    const win2Bounds = await getBounds(win2);

    await dragWindowTo(win1, win2Bounds.left - (win2Bounds.right - win2Bounds.left - 2), win2Bounds.top + 40);
    await dragWindowTo(win2, 500, 500);

    const bounds1 = await getBounds(win1);
    const bounds2 = await getBounds(win2);

    t.is(bounds1.top, bounds2.top);
    t.is(bounds1.right, bounds2.left);
});

test('right', async t => {
    const win2Bounds = await getBounds(win2);

    await dragWindowTo(win1, win2Bounds.right + 2, win2Bounds.top + 40);
    await dragWindowTo(win2, 500, 500);

    const bounds1 = await getBounds(win1);
    const bounds2 = await getBounds(win2);

    t.is(bounds1.top, bounds2.top);
    t.is(bounds1.left, bounds2.right);
});

test('resizing group horizontally', async t => {
    let bounds1 = await getBounds(win1);
    let bounds2 = await getBounds(win2);

    await dragWindowTo(win1, bounds2.right + 2, bounds2.top);
    bounds1 = await getBounds(win1);
    bounds2 = await getBounds(win2);
    const combinedWidth = bounds1.right - bounds2.left;

    robot.moveMouseSmooth(bounds2.right - 1, (bounds2.top + bounds2.bottom) / 2);
    robot.mouseToggle('down');
    robot.moveMouseSmooth(bounds2.right - 1 + 40, (bounds2.top + bounds2.bottom) / 2);
    robot.mouseToggle('up');

    // recalculate bounds & combined width
    bounds1 = await getBounds(win1);
    bounds2 = await getBounds(win2);
    let win1Width = bounds1.right - bounds1.left;
    let win2Width = bounds2.right - bounds2.left;
    let newCombinedWidth = win1Width + win2Width;
    console.log(newCombinedWidth, combinedWidth);

    t.is(combinedWidth, newCombinedWidth);
});

test('resizing group vertically', async t => {
    let bounds1 = await getBounds(win1);
    let bounds2 = await getBounds(win2);

    await dragWindowTo(win1, bounds2.left, bounds2.bottom);
    bounds1 = await getBounds(win1);
    bounds2 = await getBounds(win2);
    const combinedHeight = bounds1.bottom - bounds2.top;

    robot.moveMouseSmooth((bounds2.left + bounds2.right) / 2, bounds2.bottom);
    robot.mouseToggle('down');

    robot.moveMouseSmooth((bounds2.left + bounds2.right) / 2, bounds2.bottom + 50);
    robot.mouseToggle('up');

    // recalculate bounds & combined width
    bounds1 = await getBounds(win1);
    bounds2 = await getBounds(win2);
    let win1Height = bounds1.bottom - bounds1.top;
    let win2Height = bounds2.bottom - bounds2.top;
    let newCombinedHeight = win1Height + win2Height;

    t.is(combinedHeight, newCombinedHeight);
});

test('resize on snap, small to big', async t => {
    let bigHeight = 300;
    await resizeWindowToSize(win1, 200, 200);
    await resizeWindowToSize(win2, 300, bigHeight);
    let bounds1 = await getBounds(win1);
    let bounds2 = await getBounds(win2);
    await dragWindowTo(win1, bounds2.right + 1, bounds2.top + 5);

    // update bounds
    bounds1 = await getBounds(win1);
    bounds2 = await getBounds(win2);

    let newHeight = bounds1.bottom - bounds1.top;
    t.is(newHeight, bigHeight);
});

test('resize on snap, big to small', async t => {
    let smallHeight = 200;
    await resizeWindowToSize(win1, 300, 300);
    await resizeWindowToSize(win2, smallHeight, smallHeight);
    let bounds1 = await getBounds(win1);
    let bounds2 = await getBounds(win2);
    await dragWindowTo(win1, bounds2.right + 1, bounds2.top - 50);

    // update bounds
    bounds1 = await getBounds(win1);
    bounds2 = await getBounds(win2);

    let newHeight = bounds1.bottom - bounds1.top;
    t.is(newHeight, smallHeight);
});

// test.failing('should allow reregistration of a previously used identity', async t => {
//     const fin = await getConnection();
//     console.log(0);
//     const app1 = await fin.Application.create({
//         uuid: 'testapp1',
//         name: 'testapp1',
//         mainWindowOptions: {autoShow: true, saveWindowState: false, defaultTop: 100, defaultLeft: 100, defaultHeight: 200, defaultWidth: 200}
//     });
//     await app1.run();

//     const app2 = await fin.Application.create({
//         uuid: 'testapp2',
//         name: 'testapp2',
//         mainWindowOptions: {autoShow: true, saveWindowState: false, defaultTop: 300, defaultLeft: 400, defaultHeight: 200, defaultWidth: 200}
//     });
//     await app2.run();


//     const win1 = await fin.Window.wrap({uuid: 'testapp1', name: 'testapp1'});
//     const win2 = await fin.Window.wrap({uuid: 'testapp2', name: 'testapp2'});
//     const win2Bounds = await getBounds(win2);

//     await dragWindowTo(win1, win2Bounds.left + 50, win2Bounds.bottom + 2);
//     await dragWindowTo(win2, 500, 500);

//     const bounds1 = await getBounds(win1);
//     const bounds2 = await getBounds(win2);
//     await app1.close();
//     await app2.close();
//     t.is(bounds1.left, bounds2.left);
//     t.is(bounds1.top, bounds2.bottom);
// });