//I WILL GET THIS!

var deleteCounter = 0,
    logAll = true,
    observer = null,
    lastKey = null,
    bProcessing = false,
    btnRefreshBoxes,
    btnSelectAll,
    btnDeleteAll,
    btnDeleteSelected,
    middleDiv, leftDiv,

log = function (text) {

    if (logAll) {

        console.log('PUSHBULLY: ' + text);

    }

},

setProcessing = function (bState, key) {

    if (bState && lastKey === null) {

        lastKey = key;

        bProcessing = bState;

    } else if (!bState && key.toLowerCase() === lastKey.toLowerCase()) {

        lastKey = null;

        bProcessing = false;

    } else {

        log('SetProcessing: "' + key + '" tried to set process state, but it doesn\'t match "' + lastKey + '"');

        return;

    }

    log('bProcessing set to ' + bState.toString().toUpperCase() + ' by "' + key + '"');

},

getCBoxes = function (bChecked) {
    var query = 'standard-push-icon checkbox';

    if (bChecked !== null && bChecked) {
        query += ' checked';
    }

    var elem = middleDiv.getElementsByClassName(query);

    //console.log('GetBoxes: Retrieved boxes matching bChecked === ' + bChecked + ':');

    //console.log(elem);

    return elem;

},

updateOurButtons = function () {

    log('Updating our buttons...');

    var cBoxCountAll = getCBoxes(false).length,
        cBoxCountChecked = getCBoxes(true).length;

    var bStrDeselect = ((cBoxCountAll > 0) && (cBoxCountAll === cBoxCountChecked));

    btnSelectAll.setAttribute('select', !bStrDeselect);

    btnSelectAll.innerText =
        (bStrDeselect
            ? 'Deselect All'
            : 'Select ' + cBoxCountAll
        );

    btnSelectAll.setAttribute('title',
        (bStrDeselect
            ? 'Click to deselect all selected pushes.'
            : 'Click to select all pushes on the current page.'
        )
    );

    btnDeleteSelected.innerText = 'Delete Selected (' + cBoxCountChecked + ')';

    var disableDASA = (cBoxCountAll < 1),
        disableDS = (cBoxCountChecked < 1);

    btnDeleteAll.disabled = disableDASA;
    btnSelectAll.disabled = disableDASA;
    btnDeleteSelected.disabled = (disableDASA || disableDS);

    log('Our buttons updated.');

},

getPushes = function () {

    return middleDiv.getElementsByClassName('push');

},

dcDoCheck = function (elem, bCheck) {

    var sClassName = 'checked';

    if (bCheck) {

        elem.classList.add(sClassName);

    } else {

        elem.classList.remove(sClassName);

    }

},

checkCBox = function (cBox, bCheck) {

    var bIsChecked = (cBox.getAttribute('checked') === 'true'),
        bToCheck = null; //I want to make sure this is null...

    if (bCheck === null || bCheck !== bIsChecked) {

        if (bCheck === null) {

            bToCheck = !bIsChecked;

        } else {

            bToCheck = bCheck;

        }

        cBox.setAttribute('checked', bToCheck);

    }

    bToCheck = (bToCheck !== null && bToCheck);

    dcDoCheck(cBox, bToCheck);
    dcDoCheck(cBox.parentElement, bToCheck);

    var title;

    if (bToCheck) {

        title = 'Click to save this push from certain doom.';

    } else {

        title = 'Click to mark this push for destruction.';

    }

    cBox.setAttribute('title', title);

    if (!bProcessing) {

        log('Checkbox clicked.');

        updateOurButtons();

    }

},

propagatePush = function (push, bDeleted) {

    setProcessing(true, 'propagate');

    log('PropagatePush: Push ' + (bDeleted ? 'deletion' : 'addition') + ' propagation  initiated...');

    var cBoxes = getCBoxes(true);

    //log('PropagatePush: cBoxes:');

    //console.log(cBoxes);

    if (cBoxes.length < 1) {

        log('PropagatePush: No need to propagate; no checked pushes. Resetting checkboxes...');

        refreshCBoxes();

        setProcessing(false, 'propagate');

        return;

    }

    var prop = function (box1, box2) {

        if (box1 === null || !box1) {

            return;

        }

        if (box2 === null || !box2) {

            checkCBox(box1, false);

            return;

        } else if (box2.getAttribute('checked') === box1.getAttribute('checked')) {

            return;

        } else {

            //console.log('PROPAGATE FUCKIN PUSHES: FUCKIN BOX 1 and 2');

            //console.log(box1);
            //console.log(box2);

            checkCBox(box1, (box2.getAttribute('checked') === 'true'));

            return;

        }

    }, i;

    cBoxes = getCBoxes();

    if (bDeleted) {

        for (i = 0; i < cBoxes.length; i++) { //Push was deleted

            prop(cBoxes[i], cBoxes[i + 1]);

        }

    } else {

        initializePush(push, 0);

        for (i = cBoxes.length - 1; i > -1; i--) { //Push was added

            prop(cBoxes[i], cBoxes[i - 1]);

        }

    }

    setProcessing(false, 'propagate');

    //updateOurButtons();

},

closeButtonClick = function () {

    log('Close button clicked');

    propagatePush(this.parentElement, true);

},
getCBoxFromPush = function (push) {

    return push.getElementsByClassName('standard-push-icon')[0];

},
getClsBtnFromPush = function (push) {

    return push.getElementsByClassName('push-close')[0];

},
checkboxClick = function () {

    checkCBox(this, null);

},
initializePush = function (push, indx) {

    var cBox = getCBoxFromPush(push),
        closeButton = getClsBtnFromPush(push);

    if ((cBox === null) || (closeButton === null)) {

        return false;

    }

    if (!cBox.classList.contains('checkbox')) {

        cBox.classList.add('checkbox');

        cBox.removeEventListener('click', checkboxClick, false);
        cBox.addEventListener('click', checkboxClick, false);

    }

    checkCBox(cBox, false);

    closeButton.removeEventListener('click', closeButtonClick, false);
    closeButton.addEventListener('click', closeButtonClick, false);

    return true;

},

deletePush = function (push) {

    var btn = getClsBtnFromPush(push);

    if (btn && btn !== null) {

        btn.click();

        deleteCounter++;

    }

},

noPushNoteExists = function () {

    var note = middleDiv.getElementsByClassName('note')[0];

    if (note && note !== null) {

        log('\'No more pushes\' note was found.');

        return true;

    } else {

        log('\'No more pushes\' note was not found.');

        return false;

    }

},

getButtonsDiv = function () {

    return document.getElementById('pushbully-button-box');

},

getPushFrameDiv = function () {

    return middleDiv.getElementsByClassName('pushframe')[0];

},

refreshCBoxes = function () {

    if (getPushFrameDiv() === null) {

        log('RefreshBoxes: Push frame not found. Stopping box inject...');

        return false;

    } else {

        log('RefreshBoxes: Push frame found. About to inject boxes...');

    }
    setProcessing(true, 'refreshbox');

    var pushes = getPushes();

    if (!pushes.length) {

        log('RefreshBoxes: No pushes on which to inject checkboxes.');

        setProcessing(false, 'refreshbox');

        updateOurButtons(0);

        return false;

    }

    var counter = 0, push;

    for (var i = 0; i < pushes.length; i++) {

        push = pushes[i];

        if (push.parentNode.classList.contains('pushtype')) {

            continue;

        }

        if (initializePush(push, i)) {

            counter++;

        }

    }

    log('RefreshBoxes: Injected ' + counter + ' checkboxes.');

    setProcessing(false, 'refreshbox');

    updateOurButtons();

    return (counter > 0);

},
deleteAll = function (prompt) {

    setProcessing(true, 'deleteAll');

    var pushes = getPushes();

    if (!pushes.length) {

        log('DeleteAll: Deleted ' + deleteCounter + ' pushes. No more pushes to delete');

        noPushNoteExists();

        refreshCBoxes();

        setProcessing(false, 'deleteAll');

        return;

    }

    if (prompt && (pushes.length > 3)) {

        var conf = confirm('Are you sure you wish to delete all ' +
                (pushes.length > 49
                    ? '50+'
                    : pushes.length
                ) +
                ' pushes?\n\nThis cannot be interrupted nor undone.'
            );

        if (!conf) {

            log('Delete all cancelled');

            setProcessing(false, 'deleteAll');

            return;

        }

        log('DeleteAll: Delete all confirmed');

    }

    for (var i = pushes.length - 1; i >= 0; i--) {

        deletePush(pushes[i]);

    }

    var secsToWait = 3;

    log('DeleteAll: Deleted ' + deleteCounter + ' so far. Waiting ' +
        secsToWait + ' seconds.'
    );

    window.setTimeout(refreshCBoxes, 1000);

    window.setTimeout(function () {

        deleteAll(false);

    }, secsToWait * 1000);

},
selectAll = function () {

    var bSelect = (btnSelectAll.getAttribute('select') === 'true'),
        boxes = getCBoxes();

    if (!boxes.length) {

        log('No pushes on which to toggle checkboxes');

        return 0;

    }

    setProcessing(true, 'selectAll');

    var counter = 0, box, bIsChecked;

    for (var i = boxes.length - 1; i >= 0; i--) {

        box = boxes[i];
        bIsChecked = (box.getAttribute('checked') === 'true');

        if (bIsChecked !== bSelect) {

            checkCBox(box, bSelect);

            counter++;

        }

    }

    log(counter + ' checkboxes ' +
        (bSelect
            ? 'checked'
            : 'unchecked'
        )
    );

    setProcessing(false, 'selectAll');

    updateOurButtons();

    return counter;

},
deleteSelected = function () {

    setProcessing(true, 'deleteSelected');

    deleteCounter = 0;

    var boxes = getCBoxes(true);

    if (!boxes.length) {

        log('DeleteSelected: No checked pushes to delete');

        refreshCBoxes();

        setProcessing(false, 'deleteSelected');

        return 0;

    }

    for (var i = boxes.length - 1; i >= 0; i--) {

        deletePush(boxes[i].parentElement);

    }

    log('DeleteSelected: ' + deleteCounter + ' pushes deleted');

    window.setTimeout(function () {

        refreshCBoxes();

        setProcessing(false, 'deleteSelected');

    }, 2000);

    return deleteCounter;

},

btnRefreshBoxesClick = function () {

    log('Refresh boxes button clicked');

    refreshCBoxes();

},
btnDeleteAllClick = function () {

    log('Delete all button clicked');

    deleteCounter = 0;

    deleteAll(true);

},
btnSelectAllClick = function () {

    log('Select all button clicked');

    selectAll();

},
btnDeleteSelectedClick = function () {

    log('Delete Selected button clicked');

    deleteSelected();

},
injectButtons = function () {

    log('Injecting buttons...');

    var pushDiv = getPushFrameDiv();

    if (pushDiv === null) {

        log('InjectButtons: PushFrame div not found. Stopping inject...');

        return false;

    }

    var buttonsDiv = getButtonsDiv();

    if (buttonsDiv !== null) {

        log('InjectButtons: Buttons div already exists. Deleting it...');

        deleteElement(buttonsDiv);

        log('InjectButtons: Buttons div deleted.');


    } else {

        log('InjectButtons: Buttons div doesn\'t exist.');

    }

    log('InjectButtons: Injecting buttons...');

    var divButtons,
        btnClassName,
        createElem = function (type) {

            type = type || 'button';

            return document.createElement(type);

        };

    //Button divider
    divButtons = createElem('div');
    divButtons.id = 'pushbully-button-box';
    pushDiv.insertAdjacentElement('afterEnd', divButtons);

    //BUTTONS AND CHECKBOXES
    btnClassName = 'button btn pushbully-button pushbully';

    //Refresh boxes button
    btnRefreshBoxes = createElem();
    btnRefreshBoxes.textContent = 'Refresh Boxes';
    btnRefreshBoxes.className = btnClassName;
    btnRefreshBoxes.id = 'refresh-boxes-button';
    btnRefreshBoxes.title = 'Sometimes pushes won\'t have checkboxes on them. Click this to fix that.';
    btnRefreshBoxes.addEventListener('click', btnRefreshBoxesClick, false);
    divButtons.appendChild(btnRefreshBoxes);

    //Delete selected button
    btnDeleteSelected = createElem();
    btnDeleteSelected.textContent = 'Delete Selected';
    btnDeleteSelected.className = btnClassName;
    btnDeleteSelected.id = 'delete-selected-button';
    btnDeleteSelected.title = 'Click to delete all of the pushes you have selected.';
    btnDeleteSelected.addEventListener('click', btnDeleteSelectedClick, false);
    divButtons.appendChild(btnDeleteSelected);

    //Select all button
    btnSelectAll = createElem();
    btnSelectAll.textContent = 'Select All';
    btnSelectAll.className = btnClassName;
    btnSelectAll.id = 'select-all-button';
    btnSelectAll.addEventListener('click', btnSelectAllClick, false);
    btnSelectAll.setAttribute('select', true);
    divButtons.appendChild(btnSelectAll);

    //Delete all pushes button
    btnDeleteAll = createElem();
    btnDeleteAll.textContent = 'Delete All Pushes';
    btnDeleteAll.className = btnClassName;
    btnDeleteAll.id = 'delete-all-button';
    btnDeleteAll.title = 'Click to delete all of your pushes.';
    btnDeleteAll.addEventListener('click', btnDeleteAllClick, false);
    divButtons.appendChild(btnDeleteAll);

    log('Button box and buttons injected.');

    return true;

},

deleteElement = function (elem) {

    if (elem !== null) {

        elem.parentElement.removeChild(elem);

    }

},

doInjection = function () {

    log('Injection initiated...');

    var bChanged = false;

    if (injectButtons() | refreshCBoxes()) {

        bChanged = true;

    }

    if (bChanged) {

        log('DoInjection: Injection complete.');

    } else {

        log('DoInjection: Injection unnecessary or unsuccessful.');

    }

    return bChanged;

},

attachToClick = function (elem, handler) {

    if (elem === null) {

        return false;

    }

    var hrf = elem.getAttribute('href');

    if (hrf === null || hrf === '') {

        return false;

    }

    elem.setAttribute('pref', hrf);
    elem.removeAttribute('href');

    elem.removeEventListener('click', handler, true);
    elem.addEventListener('click', handler, true);

    return true;

},
attachToButtons = function (handler) {

    log('AttachToButtons: Attaching click events to page change anchors.');
    var btns = leftDiv.getElementsByClassName('nota'),
        counter = 0;

    for (var t = 0; t < btns.length; t++) {

        if (attachToClick(btns[t], handler)) {

            counter++;

        }

    }

    var logo = document.getElementsByClassName('logo')[0];

    attachToClick(logo, handler);

    log('AttachToButtons: Finished attaching ' + counter + ' click events to anchors.');

    return counter;

},
attachedClick = function (e) {

    var pref = this.getAttribute('pref');

    this.href = pref;

    this.click();

    this.removeAttribute('href');

    e.preventDefault();
    e.cancelBubble = true;

    window.setTimeout(totalReset(false), 1000);

},

totalReset = function () {

    window.setTimeout(function () {
        log('TotalReset: Complete reset initiated...');

        window.setTimeout(doInjection, 500);

        attachToButtons(attachedClick);

        log('TotalReset: Reset completed.');

    }, 500);

},

initialize = function () {

    setProcessing(true, 'initialize');

    middleDiv = document.getElementsByClassName('middle-list')[0];
    leftDiv = document.getElementById('device-and-friend-list');

    totalReset(true);

    observer = new MutationObserver(function (mutations) {

        if (bProcessing) { 
        log('Mutation blocked because "' + lastKey + '" left bProcessing on');
        
        return; }
        mutations.forEach(function (mutation) {

            if (mutation.addedNodes) {

                for (var i = 0; i < mutation.addedNodes.length; i++) {

                    var node = mutation.addedNodes[i];
                    if (node.className === 'push') {

                        log('Mutation: New push panel found. Propogating...');

                        propagatePush(node, false);

                    }

                }

            }

        });

    });

    if (observer) {

        observer.observe(middleDiv, {

            childList: true,
            subtree: true

        });

    }

    log('Initialize: Attached mutation observer to listen for new pushes.');

    window.addEventListener('hashchange', function () {

        log('Hash: Hash changed. Resetting...');

        totalReset(false);

    });

    log('Initialize: Attached hash changed listener to listen for page change.');

    window.onpopstate = function () {

        log('Pop: Pop state changed. Resetting...');

        totalReset(false);

    };

    log('Initialize: Attached pop state listener to listen for page change.');

    setProcessing(false, 'initialize');

};

//TODO: Add confirmation to deleteselected.

//TODO: Add index checker for deletion handler (initializepush).

//TODO: Figure out why mutation event isn't firing.

//Go to sleep earlier

window.onload = initialize();