//(function () {
//"use strict";

var deleteCounter = 0,
    logAll = true,
    observer = null,
    bProcessing = false,
    btnRefreshBoxes,
    btnSelectAll,
    btnDeleteAll,
    btnDeleteSelected,

log = function (text) {
    if (logAll) {
        console.log('PUSHBULLY: ' + text);
    }
},

setProcessing = function (bState) {
    bProcessing = bState;

    log('bProcessing === ' + bState.toString().toUpperCase());
},

getCBoxes = function (bChecked) {
    var boxes = document.body.querySelectorAll('.standard-push-icon.checkbox' +
            (bChecked
                ? '.checked'
                : ''
            )
    );

    return boxes;
},

updateSAButton = function (bSelect) {
    if (bSelect === null) {
        bSelect = (btnSelectAll.getAttribute('select') === 'true');
    }

    log('Updating SA button');

    var cBoxCountAll = getCBoxes(false).length,
        cBoxCountChecked = getCBoxes(true).length;

    var bStrDeselect = ((cBoxCountAll > 0) && (cBoxCountAll === cBoxCountChecked));

    btnSelectAll.setAttribute('textContent',
        (bStrDeselect
            ? 'Deselect ' + cBoxCountChecked
            : 'Select ' + cBoxCountAll
        )
    );

    btnSelectAll.setAttribute('title',
        (bStrDeselect
            ? 'Click to deselect all selected pushes.'
            : 'Click to select all pushes on the current page.'
        )
    );

    var disableDASA = (cBoxCountAll < 1),
        disableDS = (cBoxCountChecked < 1);

    btnDeleteAll.disabled = disableDASA;
    btnSelectAll.disabled = disableDASA;
    btnDeleteSelected.disabled = (disableDASA || disableDS);
},

getPushes = function () {
    return document.body.getElementsByClassName('push');
},

dcDoCheck = function (elem, bCheck) {
    var sClassName = 'checked';

    if (bCheck) {
        elem.classList.add(sClassName);
    }
    else {
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

        updateSAButton();
    }
},

//Begin push wiring (close, checkbox, new push)
getCBoxFromPsh = function (push) {
    return push.querySelector('.standard-push-icon');
},
getClsBtnFromPsh = function (push) {
    return push.querySelector('.push-close');
},
checkbox_Click = function () {
    checkCBox(this, null);
},
closeButton_Click = function () {
    log('Close button clicked');
    //TODO: Handle manual close button clicking (propogation)
},
initializePush = function (push) {
    var cBox = getCBoxFromPsh(push),
        closeButton = getClsBtnFromPsh(push);

    if ((cBox === null) || (closeButton === null)) {
        return false;
    }

    if (!cBox.classList.contains('checkbox')) {
        cBox.classList.add('checkbox');

        cBox.removeEventListener('click', checkbox_Click, false);
        cBox.addEventListener('click', checkbox_Click, false);
    }

    checkCBox(cBox, false);

    closeButton.removeEventListener('click', closeButton_Click, false);
    closeButton.addEventListener('click', closeButton_Click, false);

    return true;
},
//End push wiring (close, checkbox, new push)

deletePush = function (push) {
    var btn = getClsBtnFromPsh(push);

    if (btn && btn !== null) {
        btn.click();

        deleteCounter++;
    }
},

noPushNoteExists = function () {
    var note = document.querySelector('note');

    if (note && note !== null) {
        log('\'No more pushes\' note was found.');

        return true;
    } else {
        log('\'No more pushes\' note was not found.');

        return false;
    }
},

getButtonsDiv = function () {
    return document.querySelector('div.pushbully-button-box');
},

getPushFrameDiv = function () {
    return document.querySelector('div.pushframe');
},

refreshCBoxes = function () {
    setProcessing(true, this);

    log('Injecting checkboxes...');

    var pushes = getPushes();

    if (!pushes.length) {
        log('No pushes on which to inject checkboxes.');

        setProcessing(false, this);

        updateSAButton(0);

        return false;
    }

    var counter = 0, push;

    for (var i = 0; i < pushes.length; i++) {
        push = pushes[i];

        if (push.parentNode.classList.contains('pushtype')) {
            continue;
        }

        if (initializePush(push, true)) {
            counter++;
        }
    }

    log('Injected ' + counter + ' checkboxes.');

    setProcessing(false, this);

    updateSAButton();

    return (counter > 0);
},
deleteAll = function (prompt) {
    setProcessing(true, this);

    var pushes = getPushes();

    if (!pushes.length) {
        log('Deleted ' + deleteCounter + ' pushes. No more pushes to delete');

        noPushNoteExists();

        refreshCBoxes();

        return;
    }

    if (prompt && (pushes.length > 3)) {
        var conf = confirm('Are you sure you wish to delete ' +
                (pushes.length > 49
                    ? '50+'
                    : 'all ' + pushes.length
                ) +
                ' pushes?\n\nThis cannot be reliably interrupted nor undone.'
            );

        if (!conf) {
            log('Delete all cancelled');

            setProcessing(false, this);

            return;
        }

        log('Delete all confirmed');
    }

    for (var i = pushes.length - 1; i >= 0; i--) {
        deletePush(pushes[i]);
    }

    var secsToWait = 3;

    log('Deleted ' + deleteCounter + ' so far. Waiting ' +
        secsToWait + ' seconds.'
    );

    window.setTimeout(refreshCBoxes, 1000);

    window.setTimeout(function () {
        deleteAll(false);
    }, secsToWait * 1000);
},
selectAll = function () {
    var bSelect = (btnSelectAll.getAttribute('select') === 'true');

    var boxes = getCBoxes();

    if (!boxes.length) {
        log('No pushes on which to toggle checkboxes');

        return 0;
    }

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

    updateSAButton(!bSelect);

    return counter;
},
deleteSelected = function () {
    setProcessing(true, this);

    deleteCounter = 0;

    var boxes = getCBoxes(true);

    if (!boxes.length) {
        log('No checked pushes to delete');

        refreshCBoxes();

        return 0;
    }

    for (var i = boxes.length - 1; i >= 0; i--) {
        deletePush(boxes[i].parentElement);
    }

    log(deleteCounter + ' pushes deleted');

    window.setTimeout(function () {
        refreshCBoxes();
    }, 2000);

    return deleteCounter;
},

//Begin button wiring
btnRefreshBoxes_Click = function () {
    log('Refresh boxes button clicked');

    refreshCBoxes();
},
btnDeleteAll_Click = function () {
    log('Delete all button clicked');

    deleteCounter = 0;

    deleteAll(true);
},
btnSelectAll_Click = function () {
    log('Select all button clicked');

    selectAll();
},
btnDeleteSelected_Click = function () {
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
    btnRefreshBoxes.addEventListener('click', btnRefreshBoxes_Click, false);
    divButtons.appendChild(btnRefreshBoxes);

    //Delete selected button
    btnDeleteSelected = createElem();
    btnDeleteSelected.textContent = 'Delete Selected';
    btnDeleteSelected.className = btnClassName;
    btnDeleteSelected.id = 'delete-selected-button';
    btnDeleteSelected.title = 'Click to delete all of the pushes you have selected.';
    btnDeleteSelected.addEventListener('click', btnDeleteSelected_Click, false);
    divButtons.appendChild(btnDeleteSelected);

    //Select all button
    btnSelectAll = createElem();
    btnSelectAll.textContent = 'Select All';
    btnSelectAll.className = btnClassName;
    btnSelectAll.id = 'select-all-button';
    btnSelectAll.addEventListener('click', btnSelectAll_Click, false);
    btnSelectAll.setAttribute('select', true);
    divButtons.appendChild(btnSelectAll);

    //Delete all pushes button
    btnDeleteAll = createElem();
    btnDeleteAll.textContent = 'Delete All Pushes';
    btnDeleteAll.className = btnClassName;
    btnDeleteAll.id = 'delete-all-button';
    btnDeleteAll.title = 'Click to delete all of your pushes.';
    btnDeleteAll.addEventListener('click', btnDeleteAll_Click, false);
    divButtons.appendChild(btnDeleteAll);

    log('Button box and buttons injected.');

    return true;
},
//End button wiring

deleteElement = function (elem) {
    if (elem !== null) {
        elem.parentElement.removeChild(elem);
    }
},

deleteAllButtons = function () {
    var pushDiv = getButtonsDiv();

    deleteElement(pushDiv);
},

doInjection = function () {
    log('Injection initiated...');

    var bChanged = false;

    if (!getButtonsDiv()) {
        log('Buttons div not found. About inject buttons...');

        if (injectButtons()) { bChanged = true; }
    }

    if (getPushFrameDiv()) {
        log('Push frame found. About to inject boxes...');

        if (refreshCBoxes()) { bChanged = true; }
    }

    if (bChanged) {
        log('Injection complete...');
    } else {
        log('Injection unnecessary or unsuccessful.');
    }
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
    log('Attaching click events to page change anchors.');
    var btns = document.getElementsByClassName('nota'),
        counter = 0;

    for (var t = 0; t < btns.length; t++) {
        if (attachToClick(btns[t], handler)) {
            counter++;
        }
    }

    var logo = document.getElementsByClassName('logo')[0];

    attachToClick(logo, handler);
    log('Finished attaching ' + counter + ' click events to anchors.');
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

totalReset = function (bFirstTime) {
    bFirstTime = bFirstTime || false;
    window.setTimeout(function () {
        if (!bFirstTime) {
            deleteAllButtons();
        }

        log('complete reset started. first time: ' + bFirstTime);

        window.setTimeout(doInjection, 1000);

        attachToButtons(attachedClick);

        log('complete reset finished');
    }, 500);
},

initialize = function () {
    setProcessing(true, this);

    totalReset(true);

    setProcessing(true, this);

    observer = new MutationObserver(function (mutations) {
        if (bProcessing) { return; }
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    var node = mutation.addedNodes[i];
                    if (node.className === 'panel') {
                        log('New push panel found. Propogating...');

                        initializePush(node.parentElement);
                    }
                }
            }
        });
    });

    if (observer) {
        observer.observe(document, {
            childList: true,
            subtree: true
        });
    }

    log('Attached mutation observer to listen for new pushes.');

    window.addEventListener('hashchange', function () {
        log('hash changed. resetting...');

        totalReset(false);
    });

    log('Attached hash changed listener to listen for page change.');

    window.onpopstate = function () {
        log('pop state changed. resetting...');

        totalReset(false);
    };

    log('Attached pop state listener to listen for page change.');

    setProcessing(false, this);
};

window.onload = initialize();
//})();