/*global console, document, confirm, window, MutationObserver*/
(function () {
    "use strict";

    var deleteCounter = 0, //How many have we deleted?
        chkBox,
        observer, //Checkbox and observer template
        bProcessing = true, //Are we adding checkboxes?

        log = function (text) {
            console.log("PUSHBULLY: " + text);
        },

        confirmSuccess = function () {
            var noteExists = (document.getElementsByClassName("note").length > 0);

            if (noteExists) {
                log("'No more pushes' note was found. Job completion confirmed.");
            } else {
                log("However, the 'no more pushes' note was not found. There may be more notes.");
            }

            return noteExists;
        },

        closeBtnFromPush = function (push) {
            var elems = push.getElementsByClassName("push-close");

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
            return document.body.getElementsByClassName("push");
        },

        getAllCheckboxes = function (bChecked) {
            bChecked = bChecked || false;

            var allBoxes = document.body.getElementsByClassName((bChecked ? "checked " : "") + "pushbully-chk");

            return allBoxes;
        },

        deleteElement = function (elem) {
            if (elem === null) {
                log("Could not delete elem because it was null");

                return;
            }

            elem.parentElement.removeChild(elem);
        },

        updateSAButton = function (deselect, num) {
            deselect = deselect || false;
            num = num || getAllCheckboxes(false).length;

            var btn = document.getElementsByClassName("select-all-button")[0];

            btn.innerHTML = (deselect ? "Deselect all" : "Select " + num);
            btn.title = (deselect ? "Click to deselect all selected pushes." :
                    "Click to select all pushes on the first page.");

            //log("Set Select All Button to \"" + btn.innerHTML + "\"");
        },

        deleteAllCheckboxes = function (bUpdate) {
            bUpdate = bUpdate || true;

            var checkboxes = getAllCheckboxes(), i;

            if (!checkboxes.length) {
                log("No checkboxes to delete");

                return;
            }

            log("Deleting " + checkboxes.length + " checkboxes");

            for (i = checkboxes.length - 1; i >= 0; i--) {
                deleteElement(checkboxes[i]);
            }

            if (bUpdate) {
                updateSAButton(false, 0);
            }
        },

        checkABox = function (box, val) {
            box.checked = val;

            box.className = (val ? "checkbox checked pushbully-chk"
                : "checkbox pushbully-chk");

            var chkBoxLen = getAllCheckboxes(false).length;

            updateSAButton(chkBoxLen === getAllCheckboxes(true).length, chkBoxLen);

            return val;
        },

        chkBox_Click = function () {
            checkABox(this, !this.checked);

            log("Checkbox manually " + (this.checked ? "checked" : "unchecked"));
        },

        addBoxToPush = function (push, box) {
            box = box || null;

            var wire = false, newChkBox;

            if (box === null) {
                box = chkBox.cloneNode(true);

                log("Cloning chkBox due to null");

                wire = true;
            }

            newChkBox = push.getElementsByClassName("push-close pointer")[0]
                .insertAdjacentElement("afterEnd", box);

            if (wire) {
                newChkBox.addEventListener('click', chkBox_Click, false);
            }

            return newChkBox;
        },

        manualPushDeletionHandler = function () {//event) {
            if (bProcessing) {
                log("Not handling push delete because bProcessing === true");

                return;
            }

            //deleteChkBoxFromPush(event.target.parentElement);

            //log("Push deleted \'manually\'");

            //injectBoxes(); //At least until I can think straight.
        },

        evListenAdd = function (button) {
            button.removeEventListener('click', manualPushDeletionHandler, false);
            button.addEventListener('click', manualPushDeletionHandler, false);

            log("Attached event listener to push-close button");
        },

        injectBoxes = function () {
            bProcessing = true;

            log("Injecting checkboxes");

            deleteAllCheckboxes(false);

            var pushes = getAllPushes(), currBox, closeButton, i;

            if (!pushes.length) {
                log("No pushes on which to inject checkboxes");

                updateSAButton(false, 0);

                bProcessing = false;

                return;
            }

            for (i = 0; i < pushes.length; i++) {
                // updateSAButton();
                // log("iteration " + i + ". SAButton text: " + saButtonText());

                currBox = addBoxToPush(pushes[i]);

                currBox.setAttribute("num", pushes.length - i);
                pushes[i].setAttribute("num", pushes.length - i);

                closeButton = closeBtnFromPush(pushes[i]);

                if (closeButton === null) { //This wouldn't make sense, but whatever...
                    log("Close button was null on pushes[" + i + "]");

                    bProcessing = false;

                    return;
                }

                evListenAdd(closeButton);
            }

            updateSAButton(false, pushes.length);

            log(pushes.length + " checkboxes injected");

            bProcessing = false;
        },

        deleteAll = function (prompt) {
            bProcessing = true;

            var pushes = getAllPushes(), conf, i, secsToWait;

            if (!pushes.length) {
                log("Deleted " + deleteCounter + " pushes. No more pushes to delete");

                confirmSuccess();

                deleteAllCheckboxes();

                bProcessing = false;

                return 0;
            }

            if (prompt && (pushes.length > 3)) {
                conf = confirm("Are you sure you wish to delete " +
                    (pushes.length > 49 ? "50+" : "all " + pushes.length) +
                    " pushes?\n\nThis cannot be interrupted nor undone.");

                if (!conf) {
                    log("Delete all cancelled");

                    bProcessing = false;

                    return 0;
                }

                log("Delete all confirmed");
            }

            for (i = pushes.length - 1; i >= 0; i--) {
                deletePush(pushes[i]);
            }

            secsToWait = 3;

            log("Deleted " + deleteCounter + " so far. Waiting " +
                secsToWait + " seconds.");

            window.setTimeout(function () {
                injectBoxes();
            }, 1000);

            window.setTimeout(function () {
                deleteAll(false);
            }, secsToWait * 1000);

            return deleteCounter;
        },

        deleteAll_Click = function () {
            log("Delete all button clicked");

            deleteCounter = 0;

            deleteAll(true);
        },

        selectAll = function (check) {
            var boxes = getAllCheckboxes(), i, changed;

            if (!boxes.length) {
                log("No pushes on which to toggle checkboxes");

                return 0;
            }

            changed = 0;

            for (i = boxes.length - 1; i >= 0; i--) {
                if (boxes[i].checked !== check) {
                    changed++;

                    checkABox(boxes[i], check);
                }
            }

            log(changed + " checkboxes " + (check ? "checked" : "unchecked"));

            return changed;
        },

        selectAll_Click = function () {
            log("Select all button clicked");

            selectAll(this.innerHTML.indexOf("Deselect") === -1);
        },

        refreshBoxes_Click = function () {
            log("Refresh boxes button clicked");

            injectBoxes();
        },

        deleteSelected = function () {
            bProcessing = true;

            deleteCounter = 0;

            var boxes = getAllCheckboxes(true), i;

            //log("boxes length: " + boxes.length);

            if (!boxes.length) {
                log("No checked pushes to delete");

                bProcessing = false;

                injectBoxes();

                return 0;
            }

            for (i = boxes.length - 1; i >= 0; i--) {
                // log("clicking delete on boxes[" + i + "]");

                deletePush(boxes[i].parentElement);
                deleteElement(boxes[i]);
            }

            log(deleteCounter + " pushes deleted");

            /*
            if (!getAllPushes().length) {
                deleteAllCheckboxes();
            } else {*/

            window.setTimeout(function () {
                injectBoxes();
            }, 1000);
            //}

            return deleteCounter;
        },

        deleteSelected_Click = function () {
            log("Delete Selected button clicked");

            deleteSelected();
        },

        injectButtons = function (refreshing) {
            refreshing = refreshing || false;

            log("Checking if we should inject");

            var pushDiv = document.querySelector('div[class="pushframe"]'),
                divButtons,
                btnClassName,
                btnDeleteAll,
                btnSelectAll,
                btnDeleteSelected,
                btnRefreshBoxes;

            if (pushDiv === null) {
                log("No push frame found - we should not inject");

                return false;
            }

            log("Push frame existent - injection initiated");

            //Button divider
            divButtons = document.createElement('div');
            divButtons.className = "pushbully-button-box";
            pushDiv.insertAdjacentElement('afterEnd', divButtons);

            //BUTTONS AND CHECKBOXES
            btnClassName = "button btn pushbully-button pushbully";

            //Delete all button
            btnDeleteAll = document.createElement('button');
            btnDeleteAll.innerHTML = 'Delete All Pushes';
            btnDeleteAll.className = btnClassName + " delete-all-button";
            btnDeleteAll.title = "Click to delete all of your pushes.";
            divButtons.appendChild(btnDeleteAll);
            btnDeleteAll.addEventListener('click', deleteAll_Click, false);

            //Select all button
            btnSelectAll = document.createElement('button');
            btnSelectAll.className = btnClassName + " select-all-button";
            btnDeleteAll.insertAdjacentElement('beforeBegin', btnSelectAll);
            btnSelectAll.addEventListener('click', selectAll_Click, false);

            //Delete selected button
            btnDeleteSelected = document.createElement('button');
            btnDeleteSelected.innerHTML = 'Delete Selected';
            btnDeleteSelected.className = btnClassName + " delete-selected-button";
            btnDeleteSelected.title = "Click to delete all of the pushes you have selected.";
            btnSelectAll.insertAdjacentElement('beforeBegin', btnDeleteSelected);
            btnDeleteSelected.addEventListener('click', deleteSelected_Click, false);

            //Refresh boxes button
            btnRefreshBoxes = document.createElement('button');
            btnRefreshBoxes.innerHTML = 'Refresh Boxes';
            btnRefreshBoxes.className = btnClassName + " refresh-boxes-button";
            btnRefreshBoxes.title = "Sometimes pushes won't have checkboxes on them. Click this to fix that.";
            btnDeleteAll.insertAdjacentElement('afterEnd', btnRefreshBoxes);
            btnRefreshBoxes.addEventListener('click', refreshBoxes_Click, false);

            //Create checkbox template
            chkBox = document.createElement('div');
            chkBox.innerHTML = '<div class="square pushbully-chk-box"><i class="push-check pushbullet-mark">' +
                '</i></div>';
            chkBox.className = "checkbox pushbully-chk";
            chkBox.checked = false;

            log("Button box, buttons and checkbox template injected");

            return true;
        },

        boxFromPush = function (push) {
            push = push || null;

            if (push === null) {
                return null;
            }

            var elems = push.getElementsByClassName("pushbully-chk");

            if (!elems.length) {
                return null;
            }

            return elems[0];
        },

        propogateNewPush = function (newPush) {
            bProcessing = true;

            newPush = newPush || null;

            log("Beginning propagation of new push");

            var pushes = getAllPushes(),
                checkedBoxes = getAllCheckboxes(true),
                boxPrevPush,
                boxCurrPush,
                i,
                closeButton;

            if (pushes.length < 3 || checkedBoxes.length < 1) {
                log("Nevermind about the propagation thing. Switching to box injection");

                injectBoxes();

                return;
            }

            for (i = pushes.length - 1; i >= 0; i--) {
                boxPrevPush = boxFromPush(pushes[i - 1]);
                boxCurrPush = boxFromPush(pushes[i]);

                if (boxCurrPush !== null) {
                    deleteElement(boxCurrPush);
                }

                boxCurrPush = addBoxToPush(pushes[i], boxPrevPush);
            }

            if (newPush !== null) {
                newPush.setAttribute("num", pushes.length);
                boxCurrPush.setAttribute("num", pushes.length);

                closeButton = closeBtnFromPush(newPush);

                if (closeButton === null) { //This wouldn't make sense, but whatever...
                    log("Close button was null on pushes[" + i + "]");

                    bProcessing = false;

                    return;
                }

                evListenAdd(closeButton);
            }

            updateSAButton(false, pushes.length);

            log("Propagation of new push finished");

            bProcessing = false;
        },

        main = function () {
            if (!injectButtons()) {
                return;
            }

            var i, node;

            injectBoxes();

            observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (mutation.addedNodes) {
                        for (i = 0; i < mutation.addedNodes.length; i++) {
                            node = mutation.addedNodes[i];
                            if (node.className === "panel") {
                                log("about to fire mutation event");

                                propogateNewPush(node.parentElement);
                            }
                        }
                    }
                });
            });

            // Start observing "childList" events in document and its descendants
            observer.observe(document, {
                childList: true,
                subtree: true
            });

            //document.addEventListener("DOMNodeInserted", onNodeInserted, false);

            log("Attached event listener to pushes-list");
        };

    main();
}());