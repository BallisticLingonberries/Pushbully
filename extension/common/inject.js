var deleteCounter = 0,
    logAll = true,
    lastKeys = '',
    bProcessing = false,
    btnRefreshBoxes,
    btnSelectAll,
    btnDeleteAll,
    btnDeleteSelected,
    middleDiv, pushes,

log = function (text, bImportant) {

    if (logAll || bImportant) {

        console.log('PUSHBULLY: ' + text);

    }

},

setProcessing = function (bState, key) {

    if (bState) {

        lastKeys += key;

    } else {

        lastKeys = lastKeys.replace(key, '');

    }

    var newVal = (lastKeys !== '');

    if (newVal !== bProcessing) {

        bProcessing = newVal;

        log('bProcessing is now ' + newVal.toString().toUpperCase() +
            ' because "' + key + '" ' + (bState ? 'began' : 'finished') + ' operations.'
        );

    } else if (bState) {

        log('"' + key + '" started operations...');

    } else {

        log('"' + key + '" finished operations.');

    }

},

getPushes = function (bChecked, bNoInit) {

    var cPushes = middleDiv.getElementsByClassName('push');

    pushes = cPushes;

    if (bNoInit === null || !bNoInit) {

        setProcessing(true, 'getPushes');

        var init, element, cBox;

        for (var i = 0; i < cPushes.length; i++) {

            init = false;

            element = cPushes[i];

            if (!element.classList.contains('pushbully')) {

                init = true;

            } else {

                cBox = getCBoxFromPush(element);

                if (cBox === null || !cBox.classList.contains('checkbox')) {

                    init = true;

                }

            }

            if (init) {

                initializePush(element, i);

                log('getPush: Had to initialize pushes[' + i + ']');

            }

        }

        setProcessing(false, 'getPushes');

    }

    cPushes = middleDiv.getElementsByClassName('push pushbully' + (bChecked ? ' checked' : ''));

    return cPushes;

},

getSelectedPushes = function () {

    return middleDiv.getElementsByClassName('push selected');

},

updateOurButtons = function (iRelativeCount) {

    iRelativeCount = iRelativeCount || 0;

    log('Updating our buttons...');

    var pushCountAll = getPushes(false, false).length,// + iRelativeCount,
        pushCountChecked = getPushes(true, true).length,

        bIsEqual = (pushCountAll === pushCountChecked),
        bStrDeselect = ((pushCountAll > 0) && bIsEqual);

    btnSelectAll.setAttribute('select', !bStrDeselect);

    var sText = (bStrDeselect
        ? 'Deselect All'
        : 'Select All'
    );

    sText += ((pushCountAll && !bIsEqual)
        ? ' (' + pushCountAll + ')'
        : ''
    );

    btnSelectAll.innerText = sText;

    btnSelectAll.setAttribute('title',
        (bStrDeselect
            ? 'Click to deselect all selected pushes.'
            : 'Click to select all pushes on the current page.'
        )
    );

    btnDeleteSelected.innerText = 'Delete Selected' +
        (pushCountChecked
            ? ' (' + pushCountChecked + ')'
            : ''
        );

    var disableDASA = (pushCountAll < 1),
        disableDS = (pushCountChecked < 1);

    btnDeleteAll.disabled = disableDASA;
    btnSelectAll.disabled = disableDASA;
    btnDeleteSelected.disabled = (disableDASA || disableDS);

    log('Our buttons updated.');

},

dcDoCheck = function (elem, bCheck) {

    var sName = 'checked';

    if (bCheck) {

        elem.classList.add(sName);

    } else {

        elem.classList.remove(sName);

    }

},

checkPush = function (push, bCheck, index) {

    if (index) { log('checkPush: Index = ' + index); }

    var bIsChecked = (push.classList.contains('checked')),
        bToCheck = null; //I want to make sure this is null...

    if (bCheck === null || bCheck !== bIsChecked) {

        if (bCheck === null) {

            bToCheck = !bIsChecked;

        } else {

            bToCheck = bCheck;

        }

    }

    bToCheck = (bToCheck !== null && bToCheck);

    dcDoCheck(push, bToCheck);

    var title;

    if (bToCheck) {

        title = 'Click to save this push from certain doom.';

    } else {

        title = 'Click to mark this push for destruction.';

    }

    getCBoxFromPush(push).setAttribute('title', title);

    if (!bProcessing) {

        log('Checkbox clicked.');

        updateOurButtons();

    }

},

propagatePush = function (iCount, aiIndexes, bQueue) {

    if (!iCount) { return; }

    var bDeleted = (iCount < 0);

    if (bDeleted && aiIndexes === null) { return; }
    if (bQueue && aiIndexes.length < 1) { return; }

    log('PropagatePush: Push ' + (bDeleted ? 'deletion' : 'addition') + ' propagation  initiated...');

    setProcessing(true, 'propagate');

    var cPushes = getPushes(true, false);

    if (cPushes.length < 1) {

        setProcessing(false, 'propagate');

        log('PropagatePush: No need to propagate; no checked pushes. Resetting checkboxes...');

        setDelay(refreshCBoxes, 100);

        return;

    }

    var pToIsChecked, pFromIsChecked;

    var prop = function (pFrom, pTo, index) {

        if (!pTo || pTo === null) { return; }
        else if (!pFrom || pFrom === null) {

            checkPush(pTo, false, index);

            return;

        }

        pToIsChecked = pTo.classList.contains('checked');
        pFromIsChecked = pFrom.classList.contains('checked');

        if (pToIsChecked === pFromIsChecked) { return; }
        else {

            checkPush(pTo, pFromIsChecked, index);

            return;

        }

    }, i;

    cPushes = getPushes(false, true);

    if (!bDeleted) {

        for (i = 0; i < iCount; i++) {

            initializePush(cPushes[i], i);

        }

        for (i = cPushes.length - 1; i > -1; i--) {

            prop(cPushes[i - iCount], cPushes[i], i);

        }

    } else {

        for (i = aiIndexes + 1; i < cPushes.length    ; i++) {

            prop(cPushes[i], cPushes[i - 1], i);

            //log('settings pushes[' + (i - iCount) + '] to pushes[' + i + ']');

        }

    }

    setProcessing(false, 'propagate');

    updateOurButtons(iCount);

    log('PropagatePush: Push ' + (bDeleted ? 'deletion' : 'addition') + ' propagation  complete.');

},

panelClick = function () {

    selectPush(this.parentElement);

},
closeButtonClick = function () {

    if (bProcessing) { return; }

    log('Close button clicked');

    propagatePush(-1, parseInt(this.parentElement.getAttribute('index')), false);

},
getCBoxFromPush = function (push) {

    return push.getElementsByClassName('standard-push-icon')[0];

},
getClsBtnFromPush = function (push) {

    push = push || getSelectedPushes()[0];

    if (!push || push === null) { return null; }

    return push.getElementsByClassName('push-close')[0];

},
checkboxClick = function () {

    checkPush(this.parentElement, null);

},
initializeCBox = function (cBox) {
    if (!cBox.classList.contains('checkbox')) {

        cBox.removeEventListener('click', checkboxClick, false);
        cBox.addEventListener('click', checkboxClick, false);

        cBox.classList.add('checkbox');

    }
},
initializePush = function (push, indx, bNoUncheck) {

    var cBox = getCBoxFromPush(push),
        closeButton = getClsBtnFromPush(push);

    if ((cBox === null) || (closeButton === null)) { return false; }

    push.classList.add('pushbully');

    push.setAttribute('index', indx);

    initializeCBox(cBox);

    if (bNoUncheck === null || !bNoUncheck) {
        checkPush(push);
    }

    closeButton.removeEventListener('click', closeButtonClick, false);
    closeButton.addEventListener('click', closeButtonClick, false);

    var panel = push.getElementsByClassName('panel')[0];

    panel.removeEventListener('click', panelClick, true);
    panel.addEventListener('click', panelClick, true);

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

    }

    var selected = getSelectedPushes()[0];

    if (selected && selected !== null) {

        selected.classList.remove('selected');

    }

    log('RefreshBoxes: Push frame found. About to inject boxes...');

    var pushes = getPushes(false, false); //Now automatically injects (woo processor cycles!)

    if (!pushes.length) {

        log('RefreshBoxes: No pushes on which to inject checkboxes.');

        updateOurButtons();

        return false;

    }

    setProcessing(true, 'refreshBoxes');

    for (var i = 0; i < pushes.length; i++) {

        checkPush(pushes[i], false);

    }

    setProcessing(false, 'refreshBoxes');

    updateOurButtons();

    return true;

},

setDelay = function (fn, ms) {
    window.setTimeout(fn, ms);

    log('Window timeout set for ' + ms + ' milliseconds:');
    // console.log(fn);
},

checkAgain = function (bLastCheck) {
    setDelay(function () {
        refreshCBoxes();

        setDelay(function () {

            deleteAll(false, true, bLastCheck);

        }, 2000);
    }, 1000);
},
deleteAll = function (prompt, isLoop, isLastCheck) {

    prompt = prompt || true;
    isLoop = isLoop || false;
    isLastCheck = isLastCheck || false;

    var pushes = getPushes(false, isLoop || isLastCheck);

    if (!pushes.length) {

        if (isLoop) {

            log('DeleteAll: Deleted ' + deleteCounter + ' pushes. No more pushes to delete.');

            if (!isLastCheck) {

                log('DeleteAll: Checking for no more pushes note.');

                if (noPushNoteExists()) { return; }

                checkAgain(true);

                return;

            }

        } else {

            log('DeleteAll: No pushes to delete.');

        }

        refreshCBoxes();

        return;

    } else if (prompt && (pushes.length > 3)) {

        var conf = confirm('Are you sure you wish to delete all ' +
                (pushes.length > 49
                    ? '50+'
                    : pushes.length
                ) +
                ' pushes?\n\nThis cannot be interrupted nor undone.'
            );

        if (!conf) {

            setProcessing(false, 'deleteAll');

            log('Delete all cancelled');

            return;

        }

        log('DeleteAll: Delete all confirmed');

    }

    for (var i = pushes.length - 1; i >= 0; i--) {

        deletePush(pushes[i]);

    }

    log('DeleteAll: Deleted ' + deleteCounter + ' so far. Waiting...');

    checkAgain(false);

},
selectAll = function () {

    setProcessing(true, 'selectAll');

    var pushes = getPushes(false, false);

    if (!pushes.length) {

        log('No pushes on which to toggle checkboxes');

        return 0;

    }

    var bSelect = (btnSelectAll.getAttribute('select') === 'true');

    var counter = 0, push, bIsChecked;

    for (var i = 0; i < pushes.length ; i++) {

        push = pushes[i];

        bIsChecked = push.classList.contains('checked');

        if (bIsChecked !== bSelect) {

            checkPush(push, bSelect);

            counter++;

        }

    }

    setProcessing(false, 'selectAll');

    log(counter + ' checkboxes ' +
        (bSelect
            ? 'checked'
            : 'unchecked'
        )
    );

    updateOurButtons();

    return counter;

},
deleteSelected = function () {

    deleteCounter = 0;

    setProcessing(true, 'deleteSelected');

    var allPushes = getPushes(false, false);

    var pushes = getPushes(true, true);

    if (!pushes.length) {

        setProcessing(false, 'deleteSelected');

        log('DeleteSelected: No checked pushes to delete');

        refreshCBoxes();

        return 0;

    }

    if (pushes.length === allPushes.length) {

        deleteAll(false, true, true);

        return;

    }

    for (var i = pushes.length - 1; i >= 0; i--) {

        deletePush(pushes[i]);

    }

    log('DeleteSelected: ' + deleteCounter + ' pushes deleted');

    refreshCBoxes();

    setDelay(function () {

        setProcessing(false, 'deleteSelected');

        updateOurButtons();

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

    deleteAll(true, false, false);

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

            return document.createElement(type || 'button');

        };

    //Button divider
    divButtons = createElem('div');
    divButtons.id = 'pushbully-button-box';
    pushDiv.insertAdjacentElement('afterEnd', divButtons);

    //BUTTONS AND CHECKBOXES
    btnClassName = 'btn pushbully-button';

    //Refresh boxes button
    btnRefreshBoxes = createElem();
    btnRefreshBoxes.innerText = 'Refresh Boxes';
    btnRefreshBoxes.className = btnClassName;
    btnRefreshBoxes.tabIndex = 1;
    btnRefreshBoxes.id = 'refresh-boxes-button';
    btnRefreshBoxes.title = 'Sometimes pushes won\'t have checkboxes on them. Click this to fix that.';
    btnRefreshBoxes.addEventListener('click', btnRefreshBoxesClick, false);

    //Delete all pushes button
    btnDeleteAll = createElem();
    btnDeleteAll.innerText = 'Delete All Pushes';
    btnDeleteAll.className = btnClassName;
    btnDeleteAll.tabIndex = 2;
    btnDeleteAll.id = 'delete-all-button';
    btnDeleteAll.title = 'Click to delete all of your pushes.';
    btnDeleteAll.addEventListener('click', btnDeleteAllClick, false);

    //Select all button
    btnSelectAll = createElem();
    btnSelectAll.innerText = 'Select All';
    btnSelectAll.className = btnClassName;
    btnSelectAll.tabIndex = 3;
    btnSelectAll.id = 'select-all-button';
    btnSelectAll.setAttribute('select', true);
    btnSelectAll.addEventListener('click', btnSelectAllClick, false);

    //Delete selected button
    btnDeleteSelected = createElem();
    btnDeleteSelected.innerText = 'Delete Selected';
    btnDeleteSelected.className = btnClassName;
    btnDeleteSelected.tabIndex = 4;
    btnDeleteSelected.id = 'delete-selected-button';
    btnDeleteSelected.title = 'Click to delete all of the pushes you have selected.';
    btnDeleteSelected.addEventListener('click', btnDeleteSelectedClick, false);

    divButtons.appendChild(btnSelectAll);
    divButtons.appendChild(btnDeleteSelected);

    divButtons.appendChild(btnRefreshBoxes);
    divButtons.appendChild(btnDeleteAll);

    log('Button box and buttons injected.');

    return true;

},

deleteElement = function (elem) {

    if (elem === null) {

        return false;

    }

    elem.parentElement.removeChild(elem);

    return true;

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

attachedClick = function (e) {

    var pref = this.getAttribute('pref');

    this.href = pref;

    this.click();

    this.removeAttribute('href');

    e.preventDefault();
    e.cancelBubble = true;

    setDelay(totalReset, 500);

},

attachToClick = function (elem) {

    if (elem === null) { return false; }

    var hrf = elem.getAttribute('href');

    if (hrf === null || hrf === '') {

        return false;

    }

    elem.removeAttribute('href');

    elem.setAttribute('pref', hrf);

    elem.removeEventListener('click', attachedClick, true);
    elem.addEventListener('click', attachedClick, true);

    return true;

},
attachToButtons = function () {

    log('AttachToButtons: Attaching click events to page change anchors.');

    var leftDiv = document.getElementById('device-and-friend-list'),
        btns = leftDiv.getElementsByClassName('nota'),
        counter = 0;

    for (var t = 0; t < btns.length; t++) {

        if (attachToClick(btns[t], attachedClick)) {

            counter++;

        }

    }

    var logo = document.getElementsByClassName('logo')[0];

    attachToClick(logo, attachedClick);

    log('AttachToButtons: Finished attaching ' + counter + ' click events to anchors.');

    return counter;

},

totalReset = function () {

    setDelay(function () {

        log('TotalReset: Complete reset initiated...');

        setDelay(doInjection, 500);

        attachToButtons();

        log('TotalReset: Reset completed.');

    }, 500);

},

selectPush = function (sPush) {

    if (!pushes.length) {

        getPushes();

    }

    var selected = getSelectedPushes(),
        currentPush = selected[0],
        newPush = null;

    if (sPush !== 'current' && selected && selected !== null) {

        for (var i = 0; i < selected.length; i++) { //In case more than one push are selected for some reason

            selected[i].classList.remove('selected');

        }

    }

    if (!currentPush && (sPush && sPush.nodeType !== 1)) {

        newPush = pushes[0];

    } else {

        switch (sPush) {

            case 'up':
                newPush = currentPush.previousSibling || currentPush;

                break;

            case 'down':
                newPush = currentPush.nextSibling || currentPush;

                break;

            case 'current':
                checkPush(currentPush, null);

                return;

            default:
                newPush = sPush;

                break;

        }

    }

    if (!newPush || newPush === null || newPush === currentPush) { return; }

    newPush.classList.add('selected');

    var indx = parseInt(newPush.getAttribute('index'));

    if ((sPush && sPush.nodeType !== 1) && indx > 3 && indx < pushes.length - 5) {

        window.scrollTo(0, indx * 100);

    }

},

checkShouldHandle = function () {

    var pFrame = getPushFrameDiv();

    if (!pFrame || pFrame === null) { return false; }
    if (document.activeElement.parentElement === pFrame) { return false; }
    if (!getButtonsDiv()) { return false; }

    return true;

},

handleKeyUp = function (event) {

    if (!checkShouldHandle() || !getSelectedPushes()) { return; }

    if (event.keyCode === 13) { //enter

        event.preventDefault();
        event.cancelBubble = true;

        selectPush('current');

    }

},

lastIndex = 0,

handleKeyDown = function (event) {

    if (!checkShouldHandle()) { return; }

    if (event.ctrlKey && event.shiftKey) {

        switch (event.keyCode) {

            case 65: //Ctrl+Shift+A - select all
                btnSelectAll.click();

                break;

        }

    } else if (event.shiftKey && event.altKey) {

        switch (event.keyCode) {

            case 46: //Alt+Shift+Delete - delete all
                btnDeleteAll.click();

                break;

        }

    } else if (event.ctrlKey) {

        switch (event.keyCode) {

            case 46: //Ctrl+Delete - delete selected
                btnDeleteSelected.click();

                break;

        }

    } else {

        switch (event.keyCode) {

            case 38: //up
                selectPush('up');

                break;

            case 40: //down
                selectPush('down');

                break;

            case 46: //delete
                var cPush = getSelectedPushes()[0],
                    cButton = getClsBtnFromPush(cPush),
                    nextPush;

                if (!cPush || cPush === null) { return; }
                if (!cButton || cButton === null) { return; }

                if (nextPush && nextPush !== null) {

                    nextPush.classList.add('selected');

                }

                cPush.classList.remove('selected');

                cButton.click();

                lastIndex = parseInt(cPush.getAttribute('index'));

                setDelay(function () {

                    try {

                        selectPush(pushes[
                            (lastIndex
                                ? lastIndex - 1
                                : lastIndex
                            )
                        ]);

                    } catch (except) { }

                }, 300);

                break;

        }

    }

},

initialize = function () {

    middleDiv = document.getElementsByClassName('middle-list')[0];

    totalReset(true);

    var MyObserver = window.MutationObserver ||
        window.WebKitMutationObserver ||
        new MutationObserver();

    var observer = new MyObserver(function (mutations) {

        if (bProcessing) {

            log('Mutation blocked because bProcessing === true');

            return;

        }

        var count, i, node;

        mutations.forEach(function (mutation) {

            if (mutation.addedNodes) {

                count = 0;

                for (i = 0; i < mutation.addedNodes.length; i++) {

                    node = mutation.addedNodes[i];

                    if (node.className === 'panel') {

                        log('Mutation: New push panel found. Propogating...');

                        count++;

                    }

                }

                if (count) { propagatePush(count); }

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

    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('keydown', handleKeyDown, true);

};

window.onload = initialize();