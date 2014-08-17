var deleteCounter = 0, //How many have we deleted?
    chkBox,
    logAll = true,
    observer, //Checkbox and observer template
    bProcessing = true, //Are we adding checkboxes?

log = function (text, bLogAnyway) {
    bLogAnyway = bLogAnyway || false;

    if (logAll || bLogAnyway) {
        console.log('PUSHBULLY: ' + text);
    }
},

getAllCheckboxes = function (bChecked) {
    bChecked = bChecked || false;

    var allBoxes = document.body.getElementsByClassName((bChecked ? 'checked ' : '') + 'pushbully-chk');

    return allBoxes;
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

deleteElement = function (elem) {
    if (elem === null) {
        log('Could not delete elem because it was null');

        return;
    }

    elem.parentElement.removeChild(elem);
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

        // log('Cloning chkBox due to null');

        wire = true;
    }

    newChkBox = push.getElementsByClassName('push-close')[0]
                    .insertAdjacentElement('afterEnd', box);

    if (wire) {
        newChkBox.addEventListener('click', chkBox_Click, false);
    }

    return newChkBox;
},

closeBtnFromPush = function (push) {
    var elems = push.getElementsByClassName('push-close');

    if (!elems.length) {
        return null;
    }

    return elems[0];
},

getAllPushes = function () {
    return document.body.getElementsByClassName('push');
},

obObserve = function () {
    if (observer) {
        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }
},

randoNum,

checkNoPushesNote = function (bNoLog) {
    var noteExists = (document.getElementsByClassName('note').length > 0);

    if (bNoLog) { return noteExists; }

    if (noteExists) {
        log('\'No more pushes\' note was found. Job completion confirmed.');
    } else {
        log('However, the \'no more pushes\' note was not found. There may be more notes.');
    }

    return noteExists;
},

injectBoxes = function (bEnsure) {
    bEnsure = bEnsure || false;

    if (observer) { observer.disconnect(); }

    bProcessing = true;

    log('Injecting checkboxes');

    deleteAllCheckboxes(false);

    var pushes = getAllPushes(), currBox,
                    closeButton, i, nPage,
                    ioPage, sPage, sPageNum;

    if (!pushes.length) {
        log('No pushes on which to inject checkboxes');

        bProcessing = false;

        updateSAButton(0);

        window.setTimeout(function () {
            if (!checkNoPushesNote(true)) {
                ioPage = window.location.href.indexOf('page=');

                if (ioPage > -1) {
                    sPage = location.href.slice(ioPage);

                    sPageNum = parseInt(sPage[5]);

                    if (sPageNum) {
                        sPage = location.href.slice(0, ioPage - 1);

                        if (sPage.indexOf('?') < 0) {
                            nPage = '?';
                        } else {
                            nPage = '&';
                        }

                        nPage += 'page=' + (sPageNum - 1);

                        window.location = nPage;

                        return;
                    }
                }
            }

            obObserve();
        }, 3000);

        return;
    }

    for (i = 0; i < pushes.length; i++) {
        currBox = addBoxToPush(pushes[i]);

        closeButton = closeBtnFromPush(pushes[i]);

        evListenAdd(closeButton);

        if (!randoNum) { randoNum = Math.random() * 100; }

        currBox.setAttribute("push-id", randoNum);
        pushes[i].setAttribute("id", randoNum++);
    }

    log(pushes.length + ' checkboxes injected');

    bProcessing = false;

    obObserve();

    updateSAButton(pushes.length);
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

deleteAll = function (prompt) {
    bProcessing = true;

    var pushes = getAllPushes(), conf, i, secsToWait;

    if (!pushes.length) {
        log('Deleted ' + deleteCounter + ' pushes. No more pushes to delete');

        checkNoPushesNote();

        injectBoxes();

        bProcessing = false;

        return 0;
    }

    if (prompt && (pushes.length > 3)) {
        conf = confirm('Are you sure you wish to delete ' +
        (pushes.length > 49 ? '50+' : 'all ' + pushes.length) +
        ' pushes?\n\nThis cannot be reliably interrupted nor undone.');

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
    }, 1000);

    window.setTimeout(function () {
        deleteAll(false);
    }, secsToWait * 1000);

    return deleteCounter;
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
    }, 2000);

    return deleteCounter;
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

refreshBoxes_Click = function () {
    log('Refresh boxes button clicked');

    injectBoxes();
},
deleteAll_Click = function () {
    log('Delete all button clicked');

    deleteCounter = 0;

    deleteAll(true);
},
selectAll_Click = function () {
    log('Select all button clicked');

    selectAll(this.innerHTML.indexOf('Deselect') === -1);
},
deleteSelected_Click = function () {
    log('Delete Selected button clicked');

    deleteSelected();
},
injectButtons = function () {
    log('injecting the stupid buttons');

    var pushDiv = getPushDiv();

    if (pushDiv === null) {
        log('injectButtons: pushDiv was null. Stopping inject...');

        return;
    }

    var divButtons,
        btnClassName,
        btnRefreshBoxes,
        btnDeleteAll,
        btnSelectAll,
        btnDeleteSelected,
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

deleteAllButtons = function () {
    var pushDiv = getPushDiv(true);

    deleteElement(pushDiv);
},
deleteEverything = function () {
    bProcessing = true;

    deleteAllButtons();

    deleteAllCheckboxes();
},

doInjection = function () {
    log('doInject invoked');

    if (!getPushDiv(true)) {
        log('no buttons div found. injecting buttons');

        injectButtons();
    }

    if (getPushDiv()) {
        log('pushDiv found. injecting boxes');

        injectBoxes();
    }

    log('doInject exiting...');
},
//rando,
attachToClick = function (elem, handler) {
    /*rando += 2;

    var newHash = '#' + (rando).toString().slice(0, 3).replace('.', '');

    var newURL = elem.getAttribute('href');

    log(newURL);

    if (newURL.indexOf('#') > -1) {
        newURL = newURL.slice(0, newURL.indexOf('#'));
    }

    newURL += newHash;

    log(newURL);

    elem.setAttribute('href', newURL);
    /**/
    var hrf = elem.getAttribute('href');

    if (hrf === null || hrf === '') {
        return;
    }

    elem.removeAttribute('href');

    log('attaching click event to anchor');

    elem.removeEventListener('click', handler, true);

    elem.setAttribute('pref', hrf);

    elem.addEventListener('click', handler, true);
},
attachToButtons = function (handler) {
    //rando = Math.random() * 100;

    var t, btns = document.getElementsByClassName('nota');

    for (t = 0; t < btns.length; t++) {
        attachToClick(btns[t], handler);
    }

    var logo = document.getElementsByClassName('logo')[0];

    attachToClick(logo, handler);
},
attachedClick = function (e) {
    var pref = this.getAttribute('pref');

    this.href = pref;

    this.click();

    this.removeAttribute('href');

    e.preventDefault();
    e.cancelBubble = true;

    window.setTimeout(doInjection, 1000);

    window.setTimeout(function () {
        attachToButtons(attachedClick);
    }, 2000);

    return false;
},
reset = function (bFirstTime) {
    bFirstTime = bFirstTime || false;

    if (!bFirstTime) {
        deleteEverything();
    }

    log('complete reset started. first time: ' + bFirstTime);

    window.setTimeout(doInjection, 1000);

    attachToButtons(attachedClick);

    log('complete reset finished');
},
resetTimeout = function (bFirstTime) {
    window.setTimeout(function () {
        reset(bFirstTime);
    }, 500);
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
manualPushDeletionHandler = function () {//event) {
    if (bProcessing) {
        log('Not handling push delete because bProcessing === true');

        return;
    }

    log('Push deleted \'manually\'');

    window.setTimeout(injectBoxes, 500);
},
evListenAdd = function (button) {
    button.removeEventListener('click', manualPushDeletionHandler, false);
    button.addEventListener('click', manualPushDeletionHandler, false);

    //log('Attached event listener to push-close button');
},

propogatePushList = function (pshChanged, bReverse) {
    pshChanged = pshChanged || null;
    bReverse = bReverse || false;

    log('Beginning propagation of new push');

    var pushes = getAllPushes(),
        checkedBoxes = getAllCheckboxes(true),
        boxPrevPush,
        boxCurrPush,
        i;

    if (pushes.length < 3 || checkedBoxes.length < 1 || bReverse) {
        log('Switching to box injection');

        injectBoxes();

        return;
    }

    if (observer) { observer.disconnect(); }
    bProcessing = true;

    if (!bReverse) {
        for (i = pushes.length - 1; i >= 0; i--) {
            boxPrevPush = boxFromPush(pushes[i - 1]);
            boxCurrPush = boxFromPush(pushes[i]);

            if (boxCurrPush !== null) {
                deleteElement(boxCurrPush);
            }

            boxCurrPush = addBoxToPush(pushes[i], boxPrevPush);
        }

        if (pshChanged !== null) {
            evListenAdd(closeBtnFromPush(pshChanged));

            if (!randoNum) {
                randoNum = Math.random() * 100;
            }

            pshChanged.setAttribute("push-id", randoNum);
            boxCurrPush.setAttribute("id", randoNum++);
        }
    } /* else {
        for (var t = 0; t < checkedBoxes.length; t++) {
            pNum = checkedBoxes[t].getAttribute('num');

            if (pNum === checkedBoxes[t].parentElement.getAttribute('num')) { continue; }

            for (i = 0; i < pushes.length; i++) {
                if (pNum === pushes[i].getAttribute('num')) {
                    addBoxToPush(pushes[i], checkedBoxes[t]);

                    break;
                }
            }
        }
        /*
        if (pshChanged !== null) {
            rNum = pshChanged.getAttribute('num');

            boxCurrPush = document.querySelector(rNum)[0];

            deleteElement(boxCurrPush);
        }*//*
    }*/

    log('Propagation of new push finished');

    window.setTimeout(updateSAButton, 1000);

    bProcessing = false;

    obObserve();
},

initialize = function () {
    resetTimeout(true);

    observer = new MutationObserver(function (mutations) {
        if (bProcessing) { return; }
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    var node = mutation.addedNodes[i];
                    if (node.className === 'panel') {
                        log('New push panel found. Propogating...');

                        propogatePushList(node.parentElement);
                    }
                }
            }/* else if (mutation.removedNodes) {
                for (var i = 0; i < mutation.removedNodes.length; i++) {
                    var node = mutation.removedNodes[i];
                    if(node.className === 'pushFrame') {
                        log('pushFrame was deleted. Deleting buttons and checkboxes.')
                        
                        deleteEverything();
                        
                        return;
                    }
                }
            }*/
        });
    });

    obObserve();

    log('Attached mutation observer to listen for new pushes.');

    window.addEventListener('hashchange', function () {
        log('hash changed. resetting...');

        resetTimeout(false);
    });

    log('Attached hash changed listener to listen for page change.');

    window.onpopstate = function () {
        log('pop state changed. resetting...');

        resetTimeout(false);
    };

    log('Attached pop state listener to listen for page change.');
};

window.onload = initialize();