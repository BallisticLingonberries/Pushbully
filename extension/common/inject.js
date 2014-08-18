//(function () {

'use strict';

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
    var query = '.standard-push-icon.checkbox';

    if (bChecked) {
        query += '.checked';
    }

    return document.querySelectorAll(query);

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

    return document.body.getElementsByClassName('push');

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

    log('PropagatePush: Push ' + (bDeleted ? 'deletion' : 'addition') + ' propagation  initiated...');

    var cBoxes = getCBoxes(true);

    log('PropagatePush: cBoxes:');

    console.log(cBoxes);

    if (cBoxes.length < 1) {

        log('PropagatePush: No need to propagate; no checked pushes. Resetting checkboxes...');

        refreshCBoxes();

        return;

    }

    cBoxes = getCBoxes();

    var prop = function (box1, box2) {

        if (box1 === null) { return; }

        if (box2 === null) {

            checkCBox(box1, false);

            return;

        } else {

            checkCBox(box1, (box2.getAttribute('checked') === 'true'));

            return;

        }

    }, i;

    if (!bDeleted) {

        for (i = 0; i < cBoxes.length; i++) { //Push was deleted

            prop(cBoxes[i], cBoxes[i + 1]);

        }

    } else {

        for (i = cBoxes.length - 1; i > -1; i--) { //Push was added

            prop(cBoxes[i], cBoxes[i - 1]);

        }

        initializePush(push);

    }

    updateOurButtons();

},

//Begin push wiring (close, checkbox, new push, delete push)
closeButtonClick = function () {

    log('Close button clicked');

    propagatePush(this.parentElement, true);

},
getCBoxFromPush = function (push) {

    return push.querySelector('.standard-push-icon');

},
getClsBtnFromPush = function (push) {

    return push.querySelector('.push-close');

},
checkboxClick = function () {

    checkCBox(this, null);

},
initializePush = function (push) {

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
//End push wiring (close, checkbox, new push)

deletePush = function (push) {

    var btn = getClsBtnFromPush(push);

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

    return document.querySelector('div#pushbully-button-box');

},

getPushFrameDiv = function () {

    return document.querySelector('div.pushframe');

},

refreshCBoxes = function () {

    if (getPushFrameDiv() === null) {

        log('RefreshBoxes: Push frame not found. Stopping box inject...');

        return false;

    } else {

        log('RefreshBoxes: Push frame found. About to inject boxes...');

    }
    setProcessing(true, this);

    var pushes = getPushes();

    if (!pushes.length) {

        log('RefreshBoxes: No pushes on which to inject checkboxes.');

        setProcessing(false, this);

        updateOurButtons(0);

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

    log('RefreshBoxes: Injected ' + counter + ' checkboxes.');

    setProcessing(false, this);

    updateOurButtons();

    return (counter > 0);

},
deleteAll = function (prompt) {

    setProcessing(true, this);

    var pushes = getPushes();

    if (!pushes.length) {

        log('DeleteAll: Deleted ' + deleteCounter + ' pushes. No more pushes to delete');

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

    updateOurButtons();

    return counter;

},
deleteSelected = function () {

    setProcessing(true, this);

    deleteCounter = 0;

    var boxes = getCBoxes(true);

    if (!boxes.length) {

        log('DeleteSelected: No checked pushes to delete');

        refreshCBoxes();

        return 0;

    }

    for (var i = boxes.length - 1; i >= 0; i--) {

        deletePush(boxes[i].parentElement);

    }

    log('DeleteSelected: ' + deleteCounter + ' pushes deleted');

    window.setTimeout(function () {

        refreshCBoxes();

    }, 2000);

    return deleteCounter;

},

//Begin button wiring
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
//End button wiring

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
    var btns = document.getElementsByClassName('nota'),
        counter = 0;

    for (var t = 0; t < btns.length; t++) {

        if (attachToClick(btns[t], handler)) {

            counter++;

        }

    }

    var logo = document.querySelector('.logo');

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

                        log('Mutation: New push panel found. Propogating...');

                        propagatePush(node.parentElement, false);

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

    setProcessing(false, this);

};

window.onload = initialize();
//})();