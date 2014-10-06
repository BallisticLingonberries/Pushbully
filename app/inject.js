'use strict';

var isProcessing = false, keyList = [];

var log = function(toLog) {
    if (typeof (toLog) === 'string') {
        console.log('PBULLY: ' + toLog);
    } else {
        console.log(toLog);
    }
};

var setProcessing = function(sender, isProc) {
    var sIndex = keyList.indexOf(sender);

    if (isProc) {
        isProcessing = true;

        if (sIndex === -1) {
            keyList.push(sender);
        }
    } else {
        if (sIndex !== -1) {
            keyList.splice(sIndex, 1);
        }

        if (keyList.length === 0) {
            isProcessing = false;
        }
    }
};

var options, main, pushes, buttons;

options = {
    enableKBShortcuts: localStorage.getItem('enableKBShortcuts') != 'false',
    onlySelfSent: localStorage.getItem('onlySelfSent') == 'true',
    notFiles: localStorage.getItem('notFiles') == 'true',
    lockedPushes: JSON.parse(localStorage.getItem('lockedPushes') || '[]')
};

pushes = {
    list: [], checkedList: [], checkedIDs: [],
    checkmark: chrome.runtime.getURL('img/checkmark.png'),
    lockButtonTemplate: (function(lbt) {
        lbt = document.createElement('i');
        lbt.className = 'push-lock pointer';
        return lbt;
    })(),

    initialize: function(push) {
        if (!pushes.getLockButton(push)) {
            pushes.getShareButton(push)
                .insertAdjacentElement('afterEnd', pushes.lockButtonTemplate.cloneNode());
        }

        if (options.lockedPushes.indexOf(push.id) !== -1) {
            pushes.toggleLock(push, true, true);
        }
    },

    getLockButton: function(push) {
        return push.getElementsByClassName('push-lock')[0];
    },

    getShareButton: function(push) {
        return push.getElementsByClassName('push-share')[0];
    },

    getCloseButton: function(push) {
        return push.getElementsByClassName('push-close')[0];
    },

    getCheckbox: function(push) {
        return push.getElementsByClassName('profile-pic')[0];
    },

    toggleLock: function(push, lock, initial) {
        pushes.check(push, false, true);

        lock = push.classList.toggle('locked', lock);

        var
            lockButton = pushes.getLockButton(push),
            cBox = pushes.getCheckbox(push),
            id = push.id,
            indx = options.lockedPushes.indexOf(id)
        ;

        if (lock) {
            if (indx === -1) {
                options.lockedPushes.push(id);
            }

            cBox.setAttribute('title', '');
            lockButton.setAttribute('title', 'Click to unlock this push.');

            //var closeButton = pushes.getCloseButton(push);
        } else {
            if (indx !== -1) {
                options.lockedPushes.splice(indx, 1);
            }

            cBox.setAttribute('title', 'Click to mark this push for deletion.');
            lockButton.setAttribute('title', 'Click to lock this push from being deleted.');
        }

        if (!initial) {
            pushes.refresh();
        }

        localStorage.setItem('lockedPushes', JSON.stringify(options.lockedPushes));
    },

    refresh: function(deselect, partial, isMutation) {
        isMutation = (isMutation && pushes.checkedIDs.length);

        setProcessing('refresh', true);

        try {
            pushes.list = document.getElementsByClassName('push');

            if (!partial) {
                pushes.checkedList = document.getElementsByClassName('push checked');

                var push, shouldCheck;

                for (var p = 0, le = pushes.list.length; p < le; p++) {
                    push = pushes.list[p];
                    pushes.initialize(push);

                    if (isMutation) {
                        shouldCheck = (pushes.checkedIDs.indexOf(push.id) !== -1);

                        if (shouldCheck !== push.classList.contains('checked')) {
                            pushes.check(push, shouldCheck);
                        }
                    }
                }

                if (isMutation) {
                    for (var l = pushes.checkedIDs.length - 1; l >= 0; --p) {
                        if (!document.getElementById(pushes.checkedIDs[l])) {
                            pushes.checkedIDs.splice(l, 1);
                        }
                    }
                }
            }

            if (deselect) {
                pushes.deselectAll();
            }

            pushes.getcurrentLocked();

            buttons.update();
        } catch (exce) {
            console.log(exce);
        } finally {
            setProcessing('refresh', false);
        }
    },

    scrollIntoView: function(el) {
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

    getHighlit: function() {
        return document.getElementsByClassName('highlit');
    },

    highlight: function(push, hl) {
        var highlit = pushes.getHighlit(),
            len = highlit.length;

        if (len) {
            for (var d = 0; d < len; d++) {
                highlit[d].classList.remove('highlit');
            }
        }

        if (push && hl) {
            pushes.scrollIntoView(push);

            push.classList.add('highlit');
        }
    },

    check: function(push, check, noinit) {
        if ((check == push.classList.contains('checked'))
            || push.classList.contains('locked')) {
            return;
        }

        if (!noinit) {
            pushes.initialize(push);
        }

        push.classList.toggle('checked', check);

        var
            title, thumbnail,
            cBox = pushes.getCheckbox(push),
            indx = pushes.checkedIDs.indexOf(push.id)
        ;

        if (check) {
            thumbnail = cBox.getAttribute('src');

            cBox.setAttribute('src', pushes.checkmark);

            cBox.setAttribute('title', 'Click to save this push from certain doom.');

            if (indx === -1) {
                pushes.checkedIDs.push(push);
            }

            cBox.setAttribute('data-prevsrc', thumbnail);
        } else {
            thumbnail = cBox.getAttribute('data-prevsrc');

            if (thumbnail) {
                cBox.setAttribute('src', thumbnail);
                cBox.setAttribute('data-prevsrc', '');
            }

            cBox.setAttribute('title', 'Click to mark this push for destruction.');

            if (indx !== -1) {
                pushes.checkedIDs.splice(indx, 1);
            }
        }
    },

    doSelect: function(check) {
        for (var i = pushes.list.length - 1; i >= 0; i--) {
            pushes.check(pushes.list[i], check, true);
        }

        pushes.refresh();
    },

    deselectAll: function() {
        pushes.doSelect(false);
    },

    currentLocked: [],

    getcurrentLocked: function() {
        return (pushes.currentLocked = document.getElementsByClassName('push locked'));
    },

    pDelete: function(all) {
        if (isProcessing) { return; }

        var deleteCounter = 0;

        var doDelete = function(initial) {
            pushes.refresh();

            setProcessing('dodelete', true);

            pushes.getcurrentLocked();

            var toDel = all ? pushes.list : pushes.checkedList,
                len = toDel.length - (all ? pushes.currentLocked.length : 0);

            if (len > 0) {
                if (initial && len > 5) {
                    if (!confirm('Are you sure you would like to delete ' +
                                    (all ? 'all %+' : 'these %').replace('%', len) + ' pushes?\n\n' +
                                 'This cannot be canceled nor undone.')) {
                        setProcessing('dodelete', false);
                        return;
                    }
                }

                var push;

                for (var i = toDel.length - 1; i >= 0; i--) {
                    push = toDel[i];

                    if (push.classList.contains('locked')) { /*Need a way to make sure it's not going to get deleted*/
                        continue;
                    }

                    pushes.getCloseButton(push).click();

                    deleteCounter++;
                }

                if (all) {
                    window.setTimeout(doDelete, 500, false);

                    return;
                }
            }

            log('Deletion complete. Deleted ' + deleteCounter + ' pushes.');

            setProcessing('dodelete', false);

            window.setTimeout(function() {
                pushes.refresh();
            }, 500);
        };

        doDelete(true);
    },

    deleteSelected: function() {
        pushes.pDelete(false);
    }
};

buttons = {
    selectAll: null,
    deleteSelected: null,
    deleteAll: null,

    inject: function() {
        log('Injecting buttons...');

        if (!main.pushListDiv) {
            log('buttons.inject: main.pushListDiv (push_cards) not found. Stopping inject...');

            return false;
        } else if (document.getElementById('pushbully-box')) {
            log('buttons.inject: Buttons div already exists.');

            return true;
        }

        log('buttons.inject: Injecting buttons...');

        //Button divider
        var buttonsDiv = document.createElement('div');
        buttonsDiv.id = 'pushbully-box';
        buttonsDiv.className = 'roundbottom';

        log('buttonsDiv:');
        log(buttonsDiv);

        //BUTTONS
        var btnTemplate = document.createElement('button'),
            btnRefreshBoxes;
        btnTemplate.className = 'btn pushbully-button';

        //Select all button
        buttons.selectAll = btnTemplate.cloneNode();
        buttons.selectAll.innerText = 'Select All';
        buttons.selectAll.id = 'select-all-button';
        buttonsDiv.appendChild(buttons.selectAll);

        //Delete selected button
        buttons.deleteSelected = btnTemplate.cloneNode();
        buttons.deleteSelected.innerText = 'Delete Selected';
        buttons.deleteSelected.id = 'delete-selected-button';
        buttons.deleteSelected.title = 'Click to delete all selected pushes.';
        buttons.deleteSelected.onclick = pushes.deleteSelected;
        buttonsDiv.appendChild(buttons.deleteSelected);

        //Refresh boxes button
        btnRefreshBoxes = btnTemplate.cloneNode();
        btnRefreshBoxes.innerText = 'Refresh Boxes';
        btnRefreshBoxes.id = 'refresh-boxes-button';
        btnRefreshBoxes.title = 'Sometimes pushes won\'t have checkboxes on them. Click this to fix that.';
        btnRefreshBoxes.onclick = pushes.refresh; //Sends event as first parameter; means the first paramater is true
        buttonsDiv.appendChild(btnRefreshBoxes);

        //Delete all pushes button
        buttons.deleteAll = btnTemplate.cloneNode();
        buttons.deleteAll.innerText = 'Delete All';
        buttons.deleteAll.id = 'delete-all-button';
        buttons.deleteAll.title = 'Click to delete all of your pushes, starting from the current page on.';
        buttons.deleteAll.onclick = pushes.pDelete; //Sends event as first parameter; means the first paramater is true
        buttonsDiv.appendChild(buttons.deleteAll);

        main.pushListDiv.insertAdjacentElement('beforeBegin', buttonsDiv);

        log('Button box and buttons injected.');

        return true;
    },

    update: function() {
        var allLength = pushes.list.length - pushes.currentLocked.length;

        if (allLength && pushes.checkedList.length) {
            buttons.deleteSelected.innerText = 'Delete Selected (' + pushes.checkedList.length + ')';

            buttons.selectAll.innerText = 'Deselect All';
            buttons.selectAll.title = 'Click to deselect all selected pushes.';

            buttons.selectAll.onclick = pushes.deselectAll;
        } else {
            buttons.deleteSelected.innerText = 'Delete Selected';

            buttons.selectAll.innerText = 'Select All' + (allLength ? ' (' + allLength + ')' : '');
            buttons.selectAll.title = 'Click to select all pushes on the current page.';

            buttons.selectAll.onclick = pushes.doSelect;
        }

        buttons.selectAll.disabled = buttons.deleteAll.disabled = !allLength;
        buttons.deleteSelected.disabled = !pushes.checkedList.length;
    }
};

main = {
    pushListDiv: null,

    MyObserver: null,
    observer: null,

    pushListClick: function(e) {
        var elem, push = (elem = e.toElement), i = 0;

        while (i++ < 5 && (push = push.parentElement)) {
            if (push.classList.contains('push')) {
                i = null;
                break;
            }
        }

        if (i !== null) { return; }

        if (elem.classList.contains('profile-pic')) {
            log('profile-pic was clicked');

            pushes.check(push, !push.classList.contains('checked'));

            pushes.refresh(); /*Refresh here, we don't want to refresh every time a push is checked*/
        } else if (elem.classList.contains('push-close')) {
            log('push close was clicked');

            i = options.lockedPushes.indexOf(push.id);

            if (i !== -1) {
                options.lockedPushes.splice(i, 1);
            }
        } else if (elem.classList.contains('push-lock')) {
            log('push-lock was clicked');

            pushes.toggleLock(push, !push.classList.contains('locked')); /*Don't refresh here, toggleLock refreshes*/
        } else {
            log('something else was clicked - push:');
            log(push);

            pushes.highlight(push, !push.classList.contains('highlit'));
        }
    },

    doReset: function() {
        setProcessing('doreset', true);

        try {
            main.pushListDiv = document.getElementsByClassName('push_cards')[0];

            if (!main.pushListDiv) {
                return false;
            }

            main.pushListDiv.onclick = main.pushListClick;

            if (!buttons.inject()) {
                return false;
            }

            pushes.refresh();

            try {
                if (main.observer) {
                    main.observer.stop();
                }

                main.MyObserver = window.MutationObserver
                    || window.WebKitMutationObserver
                    || new MutationObserver();

                var timeout;

                main.observer = new main.MyObserver(function() {
                    log('observer fired; isProcessing = ' + isProcessing);

                    if (isProcessing) {
                        return;
                    }

                    if (timeout) {
                        window.clearTimeout(timeout);
                    }

                    timeout = window.setTimeout(function() {
                        pushes.refresh(false, false, true);
                    }, 600);
                });

                main.observer.observe(
                    main.pushListDiv,
                    {
                        childList: true,
                        subtree: true
                    }
                );

                log('Initialize: Attached mutation observer to listen for new pushes.');

                return true;
            } catch (except) {
                log('Initialize: Could not attach mutation observer due to error:');

                log(except);
            }
        } catch (ex) {
            log(ex);
        } finally {
            setProcessing('doreset', false);
        }
    },

    reset: function(iDelay) {
        if (iDelay) {
            window.setTimeout(main.doReset, iDelay);
        } else {
            return main.doReset();
        }
    },

    handleKeyDown: function(event) {
        if (event.keyCode === 27) {
            return pushes.highlight(); /*Clears highlighted pushes*/
        }

        var highlit = pushes.getHighlit()[0];

        if (event.ctrlKey && event.shiftKey) {
            switch (event.keyCode) {
                case 65: /*A key*/
                    if (!buttons.selectAll.disabled) {
                        buttons.selectAll.onclick();
                    }

                    return;
            }
        }
        else if (event.ctrlKey) {
            switch (event.keyCode) {
                case 36: /*Home key*/
                    pushes.highlight(pushes.list.firstChild);

                    return;

                case 35: /*End key*/
                    pushes.highlight(pushes.list.lastChild);

                    return;

                case 13: /*Enter key*/
                    if (highlit) {
                        pushes.check(push, !highlit.classList.contains('checked'));
                    }

                    return;
            }
        } else if (event.keyCode === 40 || event.keyCode === 38) {
            if (event.keycode === 40) { /*Down arrow key*/
                highlit = highlit ? highlit.nextSibling : pushes.list.firstChild;
            } else {
                highlit = highlit ? highlit.previousSibling : pushes.list.lastChild;
            }

            pushes.highlight(highlit);
        }
    },

    initialize: function() {
        if (!main.reset()) {
            log('Did not reset. Canceling');

            return false;
        }

        main.pushListDiv.onkeydown = main.handleKeyDown;
    }
};

main.initialize();

//TODO: Create options page (add ALL the advanced mo'fo'in' options)

//TODO: Put hotkeys and help in the options page

//TODO: Add Pushbully logo to page (possibly add a link to the options page on the Pushbullet page)

//TODO: Add tooltips to buttons and panels and pushes for hotkeys and tips

//TODO: Handle propogation