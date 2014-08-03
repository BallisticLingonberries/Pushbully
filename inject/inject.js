var deleteCounter = 0, chkBox = document.createElement('div');

main();

function main() {
    chkBox.innerHTML = '<div class="square pushbully-chk-box"><i class="push-check pushbullet-mark"></i></div>';
    chkBox.className = "checkbox pushbully-chk";

    chkBox.checked = false;

    if (injectButtons()) {
        injectBoxes();
    }
}

function injectButtons() {
    log("Checking if we should inject");

    var pushDiv = document.querySelector('div[class="pushframe"]');

    if (pushDiv === null) {
        log("No push frame found - we should not inject");

        return false;
    }

    log("Push frame found - beginning to inject");

    var divButtons = document.createElement('div');
    divButtons.className = "pushbully-button-box";

    pushDiv.insertAdjacentElement('afterEnd', divButtons);

    var btnClassName = "button btn pushbully-button";

    var btnDeleteAll = document.createElement('button');
    btnDeleteAll.innerHTML = 'Delete All Pushes';
    btnDeleteAll.className = btnClassName + " delete-all-button";
    btnDeleteAll.title = "Click to delete all of your pushes.";

    divButtons.appendChild(btnDeleteAll);

    btnDeleteAll.addEventListener('click', deleteAll_Click, false);

    var btnSelectAll = document.createElement('button');
    btnSelectAll.className = btnClassName + " select-all-button";

    btnDeleteAll.insertAdjacentElement('beforeBegin', btnSelectAll);

    btnSelectAll.addEventListener('click', selectAll_Click, false);

    resetSAButton();

    var btnDeleteSelected = document.createElement('button');
    btnDeleteSelected.innerHTML = 'Delete Selected';
    btnDeleteSelected.className = btnClassName + " delete-selected-button";
    btnDeleteSelected.title = "Click to delete all of the pushes you have selected.";

    btnSelectAll.insertAdjacentElement('beforeBegin', btnDeleteSelected);

    btnDeleteSelected.addEventListener('click', deleteSelected_Click, false);

    var btnRefreshBoxes = document.createElement('button');
    btnRefreshBoxes.innerHTML = 'Refresh Boxes';
    btnRefreshBoxes.className = btnClassName + " refresh-boxes-button";
    btnRefreshBoxes.title = "Sometimes pushes won't have checkboxes on them. Click this to fix that.";

    btnDeleteAll.insertAdjacentElement('afterEnd', btnRefreshBoxes);

    btnRefreshBoxes.addEventListener('click', refreshBoxes_Click, false);

    log("Button box & buttons injected");

    //document.getElementById("pushes-list").addEventListener("DOMNodeInserted", onNodeInserted, false);

    log("Attached event listener to pushes-list");

    return true;
}

function refreshBoxes_Click() {
    log("Refresh boxes button clicked");

    injectBoxes();
}
function injectBoxes() {
    log("Injecting checkboxes");

    deleteAllCheckboxes();

    var pushes = getAllPushes();

    if (!pushes.length) {
        log("No pushes on which to inject checkboxes");

        return;
    }

    var currBox;

    for (i = 0; i < pushes.length; i++) {
        currBox = addBoxToPush(pushes[i]);

        currBox.setAttribute("num", pushes.length - i);

        pushes[i].setAttribute("num", pushes.length - i);
    }

    log(pushes.length + " checkboxes injected");
}

function onNodeInserted(event) {
    var evPar = event.target.parentElement;

    if (evPar.className !== "push") {
        return;
    }

    log("New push received");

    propogateNewPush(evPar);
}
function propogateNewPush(newPush) {
    newPush = newPush || null;

    log("Beginning propagation of new push");

    var pushes = getAllPushes();

    if (pushes.length < 2) {
        log("Pushes: " + pushes.length + ". Propagation not required.");

        return;
    }

    var boxPrevPush, boxCurrPush;

    for (var i = pushes.length - 1; i >= 0; i--) {
        boxPrevPush = boxFromPush(pushes[i - 1]);
        boxCurrPush = boxFromPush(pushes[i]);

        if (boxCurrPush !== null) {
            deleteElement(boxCurrPush);
        }

        addBoxToPush(pushes[i], boxPrevPush);
    }

    if (newPush !== null) {
        newPush.setAttribute("num", pushes.length);
        boxCurrPush.setAttribute("num", pushes.length);
    }

    log("Propagation of new push finished");
}

function addBoxToPush(push, box) {
    box = box || null;

    var wire = false;

    if (box === null) {
        box = chkBox.cloneNode(true);

        log("Cloning chkBox due to null");

        wire = true;
    }

    var newChkBox = push.getElementsByClassName("push-close pointer")[0].insertAdjacentElement("afterEnd", box);

    if (wire) {
        newChkBox.addEventListener('click', chkBox_Click, false);
    }

    return newChkBox;
}
function boxFromPush(push) {
    push = push || null;

    if (push === null) {
        return null;
    }

    var elems = push.getElementsByClassName("pushbully-chk");

    if (!elems.length) {
        return null;
    }

    return elems[0];
}

function deleteAllCheckboxes() {
    var checkboxes = getAllCheckboxes();

    if (!checkboxes.length) {
        log("No checkboxes to delete");

        return;
    }

    log("Deleting " + checkboxes.length + " checkboxes");

    for (var i = checkboxes.length - 1; i >= 0; i--) {
        deleteElement(checkboxes[i]);
    }

    resetSAButton(false, checkboxes.length);
}
function deleteElement(elem) {
    if (elem === null) {
        log("Could not delete elem because it was null");

        return;
    }

    elem.parentElement.removeChild(elem);
}

function getAllPushes() {
    return document.body.getElementsByClassName("push");
}
function getAllCheckboxes(bChecked) {
    bChecked = bChecked || false;

    //log("bChecked is '" + bChecked + "'");

    return document.body.getElementsByClassName((bChecked ? "checked " : "") + "pushbully-chk");
}

function selectAll_Click() {
    log("Select all button clicked");

    selectAll((this.innerHTML === "Select 50"));
}
function selectAll(check) {
    var boxes = getAllCheckboxes();

    if (!boxes.length) {
        log("No pushes on which to toggle checkboxes");

        return 0;
    }

    var changed = 0;

    for (i = boxes.length - 1; i >= 0; i--) {
        if (boxes[i].checked === check) {
            continue;
        }

        changed++;

        checkABox(boxes[i], check);
    }

    if (!changed) {
        log("No pushes on which to toggle checkboxes");

        return 0;
    }

    log(changed.length + " checkboxes " + (check ? "checked" : "unchecked"));

    return changed;
}
function resetSAButton(deselect, num) {
    deselect = deselect || false;
    num = num || 50;

    var btn = document.getElementsByClassName("select-all-button")[0];

    btn.innerHTML = (deselect ? "Deselect all" : "Select " + num);
    btn.title = (deselect ? "Click to deselect all selected pushes." : "Click to select all pushes on the first page.");

    log("Set Select All Button to \"" + btn.innerHTML + "\"");
}

function chkBox_Click() {
    checkABox(this, !this.checked);

    log("Checkbox manually " + (this.checked ? "checked" : "unchecked"));
}
function checkABox(box, val) {
    box.checked = val;

    box.className = (val ? "checkbox checked pushbully-chk" : "checkbox pushbully-chk");

    var chkLen = getAllCheckboxes().length;

    resetSAButton((chkLen === getAllCheckboxes(true).length), chkLen);

    return val;
}

function deleteAll_Click() {
    log("Delete all button clicked");

    deleteCounter = 0;

    deleteAll(true);
}
function deleteAll(prompt) {
    var pushes = getAllPushes();

    if (!pushes.length) {
        log("Deleted " + deleteCounter + " pushes. No more pushes to delete");

        confirmSuccess();

        deleteAllCheckboxes();

        return 0;
    }

    if (prompt && (pushes.length > 3)) {
        var conf = confirm("Are you sure you wish to delete " + (pushes.length > 49 ? "50+" : "all " + pushes.length) + " pushes?\n\nThis cannot be interrupted nor undone.");

        if (!conf) {
            log("Delete all cancelled");

            return 0;
        }

        log("Delete all confirmed");
    }

    for (i = pushes.length - 1; i >= 0; i--) {
        pushes[i].getElementsByClassName("push-close pointer")[0].click();

        deleteCounter++;
    }

    var secsToWait = 3;

    log("Deleted " + deleteCounter + " so far. Waiting " + secsToWait + " seconds.");

    window.setTimeout(function () {
        deleteAll(false)
    }, secsToWait * 1000);

    return deleteCounter;
}

function deleteSelected_Click() {
    log("Delete Selected button clicked");

    deleteCounter = 0;

    deleteSelected();

    if (!getAllPushes().length) {
        deleteAllCheckboxes();
    }
}
function deleteSelected() {
    var boxes = getAllCheckboxes(true);

    if (!boxes.length) {
        log("No checked pushes to delete");

        injectBoxes();

        return 0;
    }

    for (var i = boxes.length - 1; i >= 0; i--) {
        log("clicking delete on boxes[" + i + "]")

        var elems = boxes[i].parentElement.getElementsByClassName("push-close pointer");

        if (elems.length) {
            elems[0].click();

            deleteCounter++;
        }
    }

    log(deleteCounter + " pushes deleted");

    return deleteCounter;
}

function confirmSuccess() {
    var noteExists = (document.getElementsByClassName("note").length > 0);

    if (noteExists) {
        log("However, the 'no more pushes' note was not found. There may be more notes.");
    } else {
        log("'No more pushes' note was found. Job completion confirmed.");
    }

    return noteExists;
}

function deleteIcon_Click() {
    injectBoxes(); //At least until I can think straight.
}

function log(text) {
    console.log("PUSHBULLY: " + text);
}