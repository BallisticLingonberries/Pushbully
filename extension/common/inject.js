var deleteCounter = 0,
logAll = true,
lastKeys = '',
bProcessing = false,
btnRefreshBoxes,
btnSelectAll,
btnDeleteAll,
btnDeleteSelected,
middleDiv, pushes;

var log = function (text, bImportant) {
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
        ' because "' + key + '" ' + (bState ? 'started' : 'finished') + ' operations.'
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

        var init, element, cBoxes;

        for (var i = 0; i < cPushes.length; i++) {
            init = false;

            element = cPushes[i];

            if (!element.classList.contains('pushbully')) {
                init = true;
            } else {
                cBoxes = getCBoxesFromPush(element);

                for (var cb = 0; cb < cBoxes.length; cb++) {
                    if (cBoxes[cb] === null || !cBoxes[cb].classList.contains('pbcbox')) {
                        init = true;
                    }
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

getSelectedPush = function () {
    return document.getElementById('selected');
},

updateOurButtons = function (bReset) {
    bReset = bReset || false;

    log('Updating our buttons...');

    var pushCountAll, pushCountChecked;

    if (bReset) {
        pushCountAll = 0;
        pushCountChecked = 0;
    } else {
        pushCountAll = getPushes(false, false).length;
        pushCountChecked = getPushes(true, true).length;
    }

    var bIsEqual = (pushCountAll === pushCountChecked),
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

    var cBoxes = getCBoxesFromPush(push);

    for (var i = 0; i < cBoxes.length; i++) {
        cBoxes[i].setAttribute('title', title);
    }

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

    updateOurButtons();

    log('PropagatePush: Push ' + (bDeleted ? 'deletion' : 'addition') + ' propagation  complete.');
},

panelClick = function (event) {
    if (event.target.classList.contains('push-check')) { return; }

    handlePushSelect(this.parentElement);
},
closeButtonClick = function () {
    if (bProcessing) { return; }

    log('Close button clicked');

    propagatePush(-1, parseInt(this.parentElement.getAttribute('index')), false);
},

getCBoxesFromPush = function (push) {
    return push.getElementsByClassName('standard-push-icon');
},
getClsBtnFromPush = function (push) {
    push = push || getSelectedPush()[0];

    if (!push || push === null) { return null; }

    return push.getElementsByClassName('push-close')[0];
},
checkboxClick = function () {
    if (!this.parentElement.classList.contains('push')) {
        checkPush(this.parentElement.parentElement, null);
    } else {
        checkPush(this.parentElement, null);
    }
},
initializeCBox = function (cBox) {
    log('initialized: ' + cBox.className);

    if (!cBox.classList.contains('pbcbox')) {
        if (cBox.classList.contains('gravatar')) {
            var prev = cBox.previousSibling;

            prev.style.backgroundImage = cBox.style.backgroundImage;

            deleteElement(cBox);

            return;
        }
    }

    cBox.classList.add('pbcbox');

    cBox.removeEventListener('click', checkboxClick, false);
    cBox.addEventListener('click', checkboxClick, false);
},
initializePush = function (push, indx, bNoUncheck) {
    var cBoxes = getCBoxesFromPush(push);

    if (!cBoxes || cBoxes === null || !cBoxes.length) { return false; }

    for (var i = 0; i < cBoxes.length; i++) {
        initializeCBox(cBoxes[i], indx);
    }

    push.setAttribute('index', indx);

    push.classList.add('pushbully');

    var closeButton = getClsBtnFromPush(push);
    closeButton.removeEventListener('click', closeButtonClick, false);
    closeButton.addEventListener('click', closeButtonClick, false);

    var panel = push.getElementsByClassName('panel')[0];
    panel.removeEventListener('click', panelClick, false);
    panel.addEventListener('click', panelClick, false);

    if (!bNoUncheck || bNoUncheck === null) {
        checkPush(push);
    }

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

unselectAll = function () {
    var d = document.getElementById('selected');

    if (d && d !== null) {
        d.removeAttribute('id');
    }
},

refreshCBoxes = function () {
    if (getPushFrameDiv() === null) {
        log('RefreshBoxes: Push frame not found. Stopping box inject...');

        return false;
    }

    unselectAll();

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

setDelay = function (fn, ms, nl) {
    window.setTimeout(fn, ms);

    if (!nl) {
        log('Window timeout set for ' + ms + ' milliseconds:');
    }
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

    var nPushes = getPushes(false, isLoop || isLastCheck);

    if (!nPushes.length) {
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
    } else if (prompt && (nPushes.length > 3)) {
        var conf = confirm('Are you sure you wish to delete all ' +
        (nPushes.length > 49
        ? '50+'
        : nPushes.length
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

    for (var i = nPushes.length - 1; i >= 0; i--) {
        deletePush(nPushes[i]);
    }

    log('DeleteAll: Deleted ' + deleteCounter + ' so far. Waiting...');

    checkAgain(false);
},
selectAll = function () {
    setProcessing(true, 'selectAll');

    var nPushes = getPushes(false, false);

    if (!nPushes.length) {
        log('No pushes on which to toggle checkboxes');

        return 0;
    }

    var bSelect = (btnSelectAll.getAttribute('select') === 'true');

    var counter = 0, push, bIsChecked;

    for (var i = 0; i < nPushes.length ; i++) {
        push = nPushes[i];

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

    var nPushes = getPushes(true, true);

    if (!nPushes.length) {
        setProcessing(false, 'deleteSelected');

        log('DeleteSelected: No checked nPushes to delete');

        refreshCBoxes();

        return 0;
    }

    if (nPushes.length === allPushes.length) {
        deleteAll(false, true, true);

        return;
    }

    for (var i = nPushes.length - 1; i >= 0; i--) {
        deletePush(nPushes[i]);
    }

    log('DeleteSelected: ' + deleteCounter + ' nPushes deleted');

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

    btnRefreshBoxes.blur();
},
btnDeleteAllClick = function () {
    log('Delete all button clicked');

    deleteCounter = 0;

    deleteAll(true, false, false);

    btnDeleteAll.blur();
},
btnSelectAllClick = function () {
    log('Select all button clicked');

    selectAll();

    btnSelectAll.blur();
},
btnDeleteSelectedClick = function () {
    log('Delete Selected button clicked');

    deleteSelected();

    btnDeleteSelected.blur();
},

injectButtons = function () {
    log('Injecting buttons...');

    var pushDiv = getPushFrameDiv();

    if (!pushDiv || pushDiv === null) {
        log('InjectButtons: PushFrame div not found. Stopping inject...');

        return false;
    }

    var buttonsDiv = getButtonsDiv();

    if (buttonsDiv && buttonsDiv !== null) {
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

    console.log(divButtons);

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

    if (!injectButtons()) { return false; }

    refreshCBoxes();

    log('DoInjection: Injection complete.');

    return true;
},

totalReset = function () {
    //attachToButtons();

    if (getButtonsDiv()) {
        updateOurButtons(true);
    }

    setDelay(function () {
        doInjection();
    }, 500);

    log('TotalReset: Complete reset initiated...');
},

scrollViewIfNeeded = function (el) {
    var topOfPage = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
        heightOfPage = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
        elY = 0, elH = 0;

    if (document.layers) { // NS4
        elY = el.y;
        elH = el.height;
    } else {
        for (var p = el; p && p.tagName !== 'BODY'; p = p.offsetParent) {
            elY += p.offsetTop;
        }

        elH = el.offsetHeight;
    }

    if ((topOfPage + heightOfPage) < (elY + elH)) {
        el.scrollIntoView(false);
    } else if (elY < topOfPage) {
        el.scrollIntoView(true);
    }
},

selectPush = function (push) {
    if (push && push !== null) {
        push.setAttribute('id', 'selected');
    }
},

handlePushSelect = function (sPush) {
    if (!sPush) {
        unselectAll();

        return;
    }

    if (!pushes.length) {
        getPushes();
    }

    var currentPush = document.getElementById('selected'),
        newPush = null;

    if (sPush.nodeType === 1) {
        newPush = sPush;
    } else if (sPush === 'current') {
        scrollViewIfNeeded(currentPush);

        setDelay(function () {
            checkPush(currentPush, null);
        }, 20, true);

        return;
    } else {
        var bUp = (sPush === 'up');

        if (currentPush) {
            newPush = (bUp
                ? newPush = currentPush.previousSibling
                : newPush = currentPush.nextSibling
            );

            if (!(newPush || bUp)) {
                unselectAll();

                return;
            }
        } else {
            newPush = pushes[bUp ? pushes.length - 1 : 0];
        }
    }

    unselectAll();

    if (newPush === currentPush) { return; }

    if (!newPush || (!newPush.classList.contains('push'))) {
        log('Not scrolling, newPush === currentPush');

        setDelay(function () {
            window.scrollTo(0, 0);
        }, 5, true);

        return;
    }   //var indx = parseInt(newPush.getAttribute('index'));

    setDelay(function () {
        scrollViewIfNeeded(newPush);

        setDelay(function () {
            selectPush(newPush);
        }, 5, true);
    }, 20, true);
},

checkShouldHandle = function () {
    var pFrame = getPushFrameDiv();

    if (!pFrame || pFrame === null) { return false; }
    if (document.activeElement.parentElement === pFrame) { return false; }
    if (!getButtonsDiv()) { return false; }

    return true;
},

handleKeyUp = function (event) {
    if (!checkShouldHandle() || !getSelectedPush()) { return; }

    if (event.ctrlKey) { return; }

    if (event.keyCode === 13) { //enter
        event.preventDefault();
        event.cancelBubble = true;

        handlePushSelect('current');
    }
},

lastIndex = 0,

launchSelectedLink = function () {
    var selected = getSelectedPush();

    if (!selected || selected === null) { return; }

    var anchor = selected.getElementsByClassName('text')[0];

    if (!anchor || anchor === null) { return; }

    anchor = anchor.children[0];

    if (anchor.nodeName.toLowerCase() !== 'a') { return; }

    window.open(anchor.getAttribute('href'));
},

/*hotkeys = {
    'btnDeleteAll': 'Alt+Shift+Delete',
    'btnSelectAll': 'Ctrl+Shift+A',
    'btnDeleteSelected': 'Ctrl+Delete',
    'btnRefreshBoxes': 'None',
    'Selected-Pushes-LaunchLink': 'Ctrl+Enter',
    'Selected-Pushes-Mark': 'Enter',
    'Selected-Pushes-Delete': 'Delete',
    'Selected-Pushes-UnselectAll': 'Escape'
},*/

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

            case 13: //Enter
                launchSelectedLink();

                break;
        }
    } else {
        switch (event.keyCode) {
            case 27: //Escape
                unselectAll();

                break;

            case 38: //up
                handlePushSelect('up');

                break;

            case 40: //down
                handlePushSelect('down');

                break;

            case 46: //delete
                var cPush = getSelectedPush(),
                    cButton = getClsBtnFromPush(cPush);

                if (!cPush || cPush === null) { return; }
                if (!cButton || cButton === null) { return; }

                lastIndex = parseInt(cPush.getAttribute('index'));

                cButton.click();

                setDelay(function () {
                    updateOurButtons();

                    setDelay(function () {
                        handlePushSelect(pushes[lastIndex]);
                    }, 200, true);
                }, 300, true);

                break;
        }
    }
},
initialize = function () {
    middleDiv = document.getElementsByClassName('middle-list')[0];

    totalReset();

    try {
        var MyObserver = window.MutationObserver || (
        window.WebKitMutationObserver ||
        new MutationObserver());

        var observer = new MyObserver(function (mutations) {
            var totalCount = 0, count, i, node;

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

                    if (count) {
                        totalCount += count;

                        if (bProcessing) {
                            log('Mutation blocked because bProcessing === true');

                            return;
                        }

                        propagatePush(totalCount);

                        totalCount = 0;
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
    } catch (except) {
        log('For some reason observer errored.');

        console.log(except);
    }

    log('Initialize: Attached mutation observer to listen for new pushes.');

    var H = window.history,
    oldPushState = H.pushState;

    H.pushState = function (state) {
        log('PushState: H.pushState state changed. Resetting...');

        if (typeof H.onpushstate === 'function') {
            H.onpushstate({ state: state });
        }

        setDelay(totalReset, 200);

        return oldPushState.apply(H, arguments);
    };

    window.onhashchange =
    window.onpopstate =
    window.onpushstate = function () {
        setDelay(totalReset, 200);
    };

    log('Initialize: Attached pop state listener to listen for page change.');

    window.addEventListener('keyup', handleKeyUp, false);
    window.addEventListener('keydown', handleKeyDown, false);
};

initialize();

//TODO: Create options page (add ALL the advanced mo'fo'in' options)

//TODO: Put hotkeys and help in the options page

//TODO: Add Pushbully logo to page (possibly add a link to the options page on the Pushbullet page)

//TODO: Add tooltips to buttons and panels and checkboxes for hotkeys and tips