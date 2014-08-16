var deleteCounter = 0, //How many have we deleted?
    chkBox,
    observer, //Checkbox and observer template
    bProcessing = true, //Are we adding checkboxes?

log = function (text) {
    console.log('PUSHBULLY: ' + text);
},

obObserve = function () {
    if (observer) {
        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }
},

confirmSuccess = function () {
    var noteExists = (document.getElementsByClassName('note').length > 0);

    if (noteExists) {
        log('\'No more pushes\' note was found. Job completion confirmed.');
    } else {
        log('However, the \'no more pushes\' note was not found. There may be more notes.');
    }

    return noteExists;
},

closeBtnFromPush = function (push) {
    var elems = push.getElementsByClassName('push-close');

    if (!elems.length) {
        return null;
    }

    return elems[0];
},

deletePush = function (push) {
    var btn = closeBtnFromPush(push);

    if (btn === null) {
        return;
    }

    btn.click();

    deleteCounter++;

    return true;
},

getAllPushes = function () {
    return document.body.getElementsByClassName('push');
},

getAllCheckboxes = function (bChecked) {
    bChecked = bChecked || false;

    var allBoxes = document.body.getElementsByClassName((bChecked ? 'checked ' : '') + 'pushbully-chk');

    return allBoxes;
},

deleteElement = function (elem) {
    if (elem === null) {
        log('Could not delete elem because it was null');

        return;
    }

    elem.parentElement.removeChild(elem);
},

updateSAButton = function (num) {
    var chkBoxLen = getAllCheckboxes(false).length,
        selectedLen = getAllCheckboxes(true).length,
        saBtn = document.getElementById('select-all-button'),
        dsBtn = document.getElementById('delete-selected-button'),
        daBtn = document.getElementById('delete-all-button');

    num = num || chkBoxLen;

    var deselect = ((chkBoxLen > 0) && (chkBoxLen === selectedLen));

    saBtn.textContent = (deselect ? 'Deselect all' : 'Select ' + num);
    saBtn.title = (deselect ? 'Click to deselect all selected pushes.' :
    'Click to select all pushes on the first page.');

    daBtn.disabled = (chkBoxLen < 1);
    saBtn.disabled = daBtn.disabled;
    dsBtn.disabled = (saBtn.disabled || (selectedLen < 1));
},

deleteAllCheckboxes = function () {
    var checkboxes = getAllCheckboxes(), i;

    if (!checkboxes.length) {
        log('No checkboxes to delete');

        return;
    }

    log('Deleting ' + checkboxes.length + ' checkboxes');

    for (i = checkboxes.length - 1; i >= 0; i--) {
        deleteElement(checkboxes[i]);
    }

    updateSAButton();
},

checkABox = function (box, val) {
    box.checked = val;

    box.className = (val ? 'checkbox checked pushbully-chk'
                         : 'checkbox pushbully-chk');

    updateSAButton();

    return val;
},

chkBox_Click = function () {
    checkABox(this, !this.checked);

    log('Checkbox manually ' + (this.checked ? 'checked' : 'unchecked'));
},

addBoxToPush = function (push, box) {
    box = box || null;

    var wire = false, newChkBox;

    if (box === null) {
        box = chkBox.cloneNode(true);

        log('Cloning chkBox due to null');

        wire = true;
    }

    newChkBox = push.getElementsByClassName('push-close')[0]
                    .insertAdjacentElement('afterEnd', box);

    if (wire) {
        newChkBox.addEventListener('click', chkBox_Click, false);
    }

    return newChkBox;
},

manualPushDeletionHandler = function () {//event) {
    if (bProcessing) {
        log('Not handling push delete because bProcessing === true');

        return;
    }

    log('Push deleted \'manually\'');

    updateSAButton();
},

evListenAdd = function (button) {
    button.removeEventListener('click', manualPushDeletionHandler, false);
    button.addEventListener('click', manualPushDeletionHandler, false);

    log('Attached event listener to push-close button');
},

injectBoxes = function (bEnsure) {
    bEnsure = bEnsure || false;

    if (observer) { observer.disconnect(); }

    bProcessing = true;

    log('Injecting checkboxes');

    deleteAllCheckboxes(false);

    var pushes = getAllPushes(), currBox, closeButton, i;

    if (!pushes.length) {
        log('No pushes on which to inject checkboxes');

        bProcessing = false;

        updateSAButton();

        return;
    }

    for (i = 0; i < pushes.length; i++) {
        currBox = addBoxToPush(pushes[i]);

        closeButton = closeBtnFromPush(pushes[i]);

        evListenAdd(closeButton);
    }

    log(pushes.length + ' checkboxes injected');

    bProcessing = false;

    obObserve();

    updateSAButton();
},

deleteAll = function (prompt) {
    bProcessing = true;

    var pushes = getAllPushes(), conf, i, secsToWait;

    if (!pushes.length) {
        log('Deleted ' + deleteCounter + ' pushes. No more pushes to delete');

        confirmSuccess();

        injectBoxes();

        bProcessing = false;

        return 0;
    }

    if (prompt && (pushes.length > 3)) {
        conf = confirm('Are you sure you wish to delete ' +
        (pushes.length > 49 ? '50+' : 'all ' + pushes.length) +
        ' pushes?\n\nThis cannot be interrupted nor undone.');

        if (!conf) {
            log('Delete all cancelled');

            bProcessing = false;

            return 0;
        }

        log('Delete all confirmed');
    }

    for (i = pushes.length - 1; i >= 0; i--) {
        deletePush(pushes[i]);
    }

    secsToWait = 3;

    log('Deleted ' + deleteCounter + ' so far. Waiting ' +
    secsToWait + ' seconds.');

    window.setTimeout(function () {
        injectBoxes();
    }, 500);

    window.setTimeout(function () {
        deleteAll(false);
    }, secsToWait * 1000);

    return deleteCounter;
},

deleteAll_Click = function () {
    log('Delete all button clicked');

    deleteCounter = 0;

    deleteAll(true);
},

selectAll = function (check) {
    var boxes = getAllCheckboxes(), i, changed;

    if (!boxes.length) {
        log('No pushes on which to toggle checkboxes');

        return 0;
    }

    changed = 0;

    for (i = boxes.length - 1; i >= 0; i--) {
        if (boxes[i].checked !== check) {
            changed++;

            checkABox(boxes[i], check);
        }
    }

    log(changed + ' checkboxes ' + (check ? 'checked' : 'unchecked'));

    return changed;
},

selectAll_Click = function () {
    log('Select all button clicked');

    selectAll(this.innerHTML.indexOf('Deselect') === -1);
},

refreshBoxes_Click = function () {
    log('Refresh boxes button clicked');

    injectBoxes();
},

deleteSelected = function () {
    bProcessing = true;

    deleteCounter = 0;

    var boxes = getAllCheckboxes(true), i;

    if (!boxes.length) {
        log('No checked pushes to delete');

        bProcessing = false;

        injectBoxes();

        return 0;
    }

    for (i = boxes.length - 1; i >= 0; i--) {
        deletePush(boxes[i].parentElement);
        deleteElement(boxes[i]);
    }

    log(deleteCounter + ' pushes deleted');

    window.setTimeout(function () {
        injectBoxes();
    }, 5000);

    return deleteCounter;
},

deleteSelected_Click = function () {
    log('Delete Selected button clicked');

    deleteSelected();
},

getPushDiv = function (bGetButtonsDiv) {
    var pushDiv;

    if (bGetButtonsDiv) {
        pushDiv = document.getElementById('pushbully-button-box');
    } else {
        pushDiv = document.querySelector('div[class=\'pushframe\']');
    }

    return pushDiv;
},

injectButtons = function () {
    log('injecting the stupid buttons');

    var pushDiv = getPushDiv(),
        divButtons,
        btnClassName,
        btnDeleteAll,
        btnSelectAll,
        btnDeleteSelected,
        btnRefreshBoxes,
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
    btnRefreshBoxes.addEventListener('click', refreshBoxes_Click, false);
    divButtons.appendChild(btnRefreshBoxes);

    //Delete selected button
    btnDeleteSelected = createElem();
    btnDeleteSelected.textContent = 'Delete Selected';
    btnDeleteSelected.className = btnClassName;
    btnDeleteSelected.id = 'delete-selected-button';
    btnDeleteSelected.title = 'Click to delete all of the pushes you have selected.';
    btnDeleteSelected.addEventListener('click', deleteSelected_Click, false);
    divButtons.appendChild(btnDeleteSelected);

    //Select all button
    btnSelectAll = createElem();
    btnSelectAll.textContent = 'Select All';
    btnSelectAll.className = btnClassName;
    btnSelectAll.id = 'select-all-button';
    btnSelectAll.addEventListener('click', selectAll_Click, false);
    divButtons.appendChild(btnSelectAll);

    //Delete all pushes button
    btnDeleteAll = createElem();
    btnDeleteAll.textContent = 'Delete All Pushes';
    btnDeleteAll.className = btnClassName;
    btnDeleteAll.id = 'delete-all-button';
    btnDeleteAll.title = 'Click to delete all of your pushes.';
    btnDeleteAll.addEventListener('click', deleteAll_Click, false);
    divButtons.appendChild(btnDeleteAll);

    //Create checkbox template
    chkBox = createElem('div');
    chkBox.className = 'checkbox pushbully-chk';
    chkBox.checked = false;

    var cBBClass = 'square pushbully-chk-box',
        cBIClass = 'push-check pushbullet-mark';

    chkBox.innerHTML = '<div class="' + cBBClass + '">' +
                            '<i class="' + cBIClass + '">' +
                            '</i>' +
                       '</div>';

    log('Button box, buttons and checkbox template injected');
},

boxFromPush = function (push) {
    push = push || null;

    if (push === null) {
        return null;
    }

    var elems = push.getElementsByClassName('pushbully-chk');

    if (!elems.length) {
        return null;
    }

    return elems[0];
},

propogatePushList = function (newPush, bReverse) {
    if (observer) { observer.disconnect(); }

    bProcessing = true;

    newPush = newPush || null;
    bReverse = bReverse || false;

    log('Beginning propagation of new push');

    var pushes = getAllPushes(),
        checkedBoxes = getAllCheckboxes(true),
        boxPrevPush,
        boxCurrPush,
        i;

    if (pushes.length < 3 || checkedBoxes.length < 1) {
        log('Switching to box injection');

        injectBoxes();

        return;
    }

    if (!bReverse) {
        for (i = pushes.length - 1; i >= 0; i--) {
            boxPrevPush = boxFromPush(pushes[i - 1]);
            boxCurrPush = boxFromPush(pushes[i]);

            if (boxCurrPush !== null) {
                deleteElement(boxCurrPush);
            }

            boxCurrPush = addBoxToPush(pushes[i], boxPrevPush);
        }

        if (newPush !== null) {
            evListenAdd(closeBtnFromPush(newPush));
        }
    } else {
        for (i = 0; i < pushes.length; i++) {
            boxPrevPush = boxFromPush(pushes[i + 1]);
            boxCurrPush = boxFromPush(pushes[i]);

            if (boxCurrPush !== null) {
                deleteElement(boxCurrPush);
            }

            boxCurrPush = addBoxToPush(pushes[i], boxPrevPush);
        }
    }

    log('Propagation of new push finished');

    window.setTimeout(updateSAButton, 500);

    bProcessing = false;

    obObserve();
},

doInjection = function () {
    log('Beginning injections');

    if (!getPushDiv(true)) {
        injectButtons();
    }

    if (getPushDiv()) {
        injectBoxes();
    }
},

btnOnclick = function (e) {
    var pref = this.getAttribute('pref');

    this.href = pref;

    this.click();

    this.href = '';

    e.preventDefault();
    e.cancelBubble = true;

    window.setTimeout(doInjection, 500);

    return false;
},

attachToButton = function (btn) {
    btn.setAttribute('pref', btn.href.replace('https://www.pushbullet.com', ''));

    btn.href = '';

    btn.onclick = btnOnclick;
},

initialize = function () {
    window.setTimeout(doInjection, 100);

    var btns = document.getElementsByClassName('nota'),
        logo = document.getElementsByClassName('logo')[0],
        node, i;

    for (i = 0; i < btns.length; i++) {
        attachToButton(btns[i]);
    }

    attachToButton(logo);

    observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes) {
                for (i = 0; i < mutation.addedNodes.length; i++) {
                    node = mutation.addedNodes[i];
                    if (node.className === 'panel') {
                        log('New push panel found. Propogating...');

                        propogatePushList(node.parentElement);
                    }
                }
            } else if (mutation.addedNodes) {
                for (i = 0; i < mutation.removedNodes.length; i++) {
                    node = mutation.removedNodes[i];
                    if (node.className === 'panel') {
                        log('New push panel found. Propogating...');

                        propogatePushList(node.parentElement, true);
                    }
                }
            }
        });
    });

    obObserve();

    log('Attached mutation observer to listen for new pushes.');
};

initialize();