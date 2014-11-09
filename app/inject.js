'use strict';

var isProcessing, keyList = [];

var log = function(toLog) {
    console.log('PBULLY: ', toLog, '\nkeyList: ', keyList);
};

var setProcessing = function(sender, isProc) {
    var sIndex = keyList.indexOf(sender);

    if (isProc && sIndex === -1) {
        keyList.push(sender);
    } else if (!isProc && sIndex !== -1) {
        keyList.splice(sIndex, 1);
    }

    isProcessing = !!keyList.length;
};

var options, main, pushes, buttons;

options = {
    //enableKBShortcuts: localStorage.getItem('enableKBShortcuts') != 'false',
    //onlySelfSent: localStorage.getItem('onlySelfSent') == 'true',
    //notFiles: localStorage.getItem('notFiles') == 'true',
    lockedPushes: JSON.parse(localStorage.getItem('lockedPushes') || '[]')
};

pushes = {
    list: [], checkedList: [], lockedList: [],

    checkmark: chrome.runtime.getURL('img/checkmark.png'),

    lockButtonTemplate: (function() {
        var lbt = document.createElement('i');
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

        push.classList.toggle('locked', lock);

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

        localStorage.setItem('lockedPushes', JSON.stringify(options.lockedPushes));

        if (!initial) {
            pushes.refresh();
        }
    },

    updateList: function() {
        return (pushes.list = main.pushListDiv.getElementsByClassName('push'));
    },
    updateCheckedList: function() {
        pushes.checkedList = main.pushListDiv.getElementsByClassName('push checked');
    },
    updateLockedList: function() {
        pushes.lockedList = main.pushListDiv.getElementsByClassName('push locked');
    },
    updateAllLists: function() {
        if (pushes.updateList().length) {
            pushes.updateCheckedList();
            pushes.updateLockedList();
        } else {
            pushes.checkedList = [];
            pushes.lockedList = [];
            if (!window.location.search) {
                options.lockedPushes = [];
            }
        }
    },

    refresh: function(deselect, partial) {
        if (isProcessing) { return; }

        setProcessing('refresh', true);
        log('refreshing');

        try {
            pushes.updateAllLists();

            if (!partial) {
                for (var push, p = 0, le = pushes.list.length; p < le; p++) {
                    push = pushes.list[p];
                    pushes.initialize(push);

                    if (deselect) {
                        pushes.check(push, false, true);
                    }
                }
            }
        } catch (exce) {
            log(exce);
        } finally {
            buttons.update();

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
        return main.pushListDiv.getElementsByClassName('highlit');
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
            thumbnail,
            cBox = pushes.getCheckbox(push)
        ;

        if (check) {
            thumbnail = cBox.getAttribute('src');

            cBox.setAttribute('src', pushes.checkmark);

            cBox.setAttribute('title', 'Click to save this push from certain doom.');

            cBox.setAttribute('data-prevsrc', thumbnail);
        } else {
            thumbnail = cBox.getAttribute('data-prevsrc');

            if (thumbnail) {
                cBox.setAttribute('src', thumbnail);
                cBox.setAttribute('data-prevsrc', '');
            }

            cBox.setAttribute('title', 'Click to mark this push for destruction.');
        }
    },

    doSelect: function(check) {
        for (var i = pushes.list.length - 1; i >= 0; i--) {
            pushes.check(pushes.list[i], check, true);
        }

        pushes.refresh();
    },

    pDelete: function(all) {
        if (isProcessing) { return; }

        var deleteCounter = 0;

        var doDelete = function(initial) {
            pushes.refresh();

            setProcessing('dodelete', true);

            try {
                var toDel = all ? pushes.list : pushes.checkedList,
                    len = toDel.length - (all ? pushes.lockedList.length : 0);

                if (len > 0) {
                    if (initial && len > 5 && !confirm(
                            'Are you sure you would like to delete ' +
                            (all ? 'all %' : 'these %').replace('%', len + (all && len === 50 ? '+' : '')) + ' pushes?\n\n' +
                            'This cannot be canceled nor undone.')
                        ) {
                        setProcessing('dodelete', false);
                        return;
                    }

                    for (var push, i = toDel.length - 1; i >= 0; i--) {
                        push = toDel[i];

                        if (push.classList.contains('locked') || options.lockedPushes.indexOf(push.id) !== -1) { /*Need a way to make sure it's not going to get deleted*/
                            continue;
                        }

                        pushes.getCloseButton(push).click();

                        deleteCounter++;
                    }

                    if (all) {
                        window.setTimeout(doDelete, 500);

                        return;
                    }
                }

                log('Deletion complete. Deleted ' + deleteCounter + ' pushes.');
            } catch (ex) {
                log('Deletion failed. Error: ', ex);
            }

            setProcessing('dodelete', false);
        };

        doDelete(true);
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

        //BUTTONS
        var btnTemplate = document.createElement('button'),
            btnRefreshBoxes;
        btnTemplate.className = 'btn pushbully-button';

        //Select all button
        buttons.selectAll = btnTemplate.cloneNode();
        buttons.selectAll.innerText = 'Select All';
        buttons.selectAll.id = 'select-all-button';

        //Delete selected button
        buttons.deleteSelected = btnTemplate.cloneNode();
        buttons.deleteSelected.innerText = 'Delete Selected';
        buttons.deleteSelected.id = 'delete-selected-button';
        buttons.deleteSelected.title = 'Click to delete all selected pushes.';
        buttons.deleteSelected.onclick = function() {
            pushes.pDelete(false);
        };

        //Refresh boxes button
        btnRefreshBoxes = btnTemplate.cloneNode();
        btnRefreshBoxes.innerText = 'Refresh Boxes';
        btnRefreshBoxes.id = 'refresh-boxes-button';
        btnRefreshBoxes.title = 'Sometimes pushes won\'t have checkboxes on them. Click this to fix that.';
        btnRefreshBoxes.onclick = function() {
            pushes.refresh(true);
        };

        //Delete all pushes button
        buttons.deleteAll = btnTemplate.cloneNode();
        buttons.deleteAll.innerText = 'Delete All';
        buttons.deleteAll.id = 'delete-all-button';
        buttons.deleteAll.title = 'Click to delete all of your pushes, starting from the current page on.';
        buttons.deleteAll.onclick = function() {
            pushes.pDelete(true);
        };

        buttonsDiv.appendChild(buttons.selectAll);
        buttonsDiv.appendChild(buttons.deleteSelected);
        buttonsDiv.appendChild(btnRefreshBoxes);
        buttonsDiv.appendChild(buttons.deleteAll);

        main.pushListDiv.insertAdjacentElement('beforeBegin', buttonsDiv);

        log('Button box and buttons injected.');

        return true;
    },

    update: function() {
        var allLength = pushes.list.length - pushes.lockedList.length;

        if (allLength && pushes.checkedList.length) {
            buttons.deleteSelected.innerText = 'Delete Selected (' + pushes.checkedList.length + ')';

            buttons.selectAll.innerText = 'Deselect All';
            buttons.selectAll.title = 'Click to deselect all selected pushes.';

            buttons.selectAll.onclick = function() {
                if (buttons.selectAll.disabled) { return; }

                pushes.doSelect(false);
            };
        } else {
            buttons.deleteSelected.innerText = 'Delete Selected';

            buttons.selectAll.innerText = 'Select All' + (allLength ? ' (' + allLength + ')' : '');
            buttons.selectAll.title = 'Click to select all pushes on the current page.';

            buttons.selectAll.onclick = function() {
                if (buttons.selectAll.disabled) { return; }

                pushes.doSelect(true);
            };
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

        if (i) { return; }

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

            pushes.refresh(true);
        } else if (elem.classList.contains('push-lock')) {
            log('push-lock was clicked');

            pushes.toggleLock(push, !push.classList.contains('locked')); /*Don't refresh here, toggleLock refreshes*/
        } else {
            log('something else was clicked - push:');

            pushes.highlight(push, !push.classList.contains('highlit'));
        }
    },

    doReset: function() {
        setProcessing('doreset', true);

        try {
            main.pushListDiv = document.getElementsByClassName('push_cards')[0];

            if (!main.pushListDiv
                || !buttons.inject()) {
                return false;
            }

            main.pushListDiv.onclick = main.pushListClick;

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

                    // alert('mutation fired');

                    if (timeout) {
                        window.clearTimeout(timeout);
                    }

                    timeout = window.setTimeout(pushes.refresh, 700);
                });

                main.observer.observe(main.pushListDiv, { childList: true });

                log('Initialize: Attached mutation observer to listen for new pushes.');

                return true;
            } catch (except) {
                log('Initialize: Could not attach mutation observer due to error:');

                log(except);
            }
        } catch (ex) {
            log(ex);
        } finally {
            window.setTimeout(pushes.refresh, 1000);

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
            pushes.highlight(); /*Clears highlighted pushes*/
            return;
        }

        var highlit = pushes.getHighlit()[0] || pushes.list[0];

        if (event.ctrlKey) {
            if (event.shiftKey && event.keycode === 65 /*A key*/) {
                buttons.selectAll.onclick();
            } else {
                switch (event.keyCode) {
                    case 36: /*Home key*/
                        pushes.highlight(pushes.list[0]);

                        return;

                    case 35: /*End key*/
                        pushes.highlight(pushes.list[pushes.list.length - 1]);

                        return;

                    case 13: /*Enter key*/
                        if (highlit) {
                            pushes.check(push, !highlit.classList.contains('checked'));
                        }

                        return;
                }
            }
        } else if (event.keyCode === 40 || event.keyCode === 38) {
            highlit = event.keycode === 40 ? highlit.nextSibling : highlit.previousSibling;

            pushes.highlight(highlit);
        }
    }
};

if (main.reset()) {
    main.pushListDiv.addEventListener('keydown', main.handleKeyDown, true);
} else {
    log('Did not reset. Canceling');
}

//TODO: Create options page (add ALL the advanced mo'fo'in' options)

//TODO: Put hotkeys and help in the options page

//TODO: Add Pushbully logo to page (possibly add a link to the options page on the Pushbullet page)

//TODO: Add tooltips to buttons and panels and pushes for hotkeys and tips

//TODO: Handle propogation