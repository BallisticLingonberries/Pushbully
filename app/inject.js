'use strict';

var log = function(toLog) {
    console.log('PBULLY: ', toLog);
};

var main, pushes, buttons;

pushes = {
    list: [], checkedList: [],

    getShareButton: function(push) {
        return push.getElementsByClassName('push-share')[0];
    },
    getCloseButton: function(push) {
        return push.getElementsByClassName('push-close')[0];
    },
    getCheckbox: function(push) {
        return push.getElementsByClassName('profile-pic')[0];
    },

    updateLists: function() {
        pushes.list = main.pushListDiv.getElementsByClassName('push');
        pushes.checkedList = main.pushListDiv.getElementsByClassName('push checked');
    },

    refresh: function(reset) {
        log('refreshing');

        try {
            pushes.updateLists();

            if (reset) {
                for (var p = 0, le = pushes.list.length; p < le; p++) {
                    pushes.check(pushes.list[p], false);
                }
            }
        } catch (exce) {
            log(exce);
            throw exce;
        } finally {
            pushes.updateLists();

            buttons.update();
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

    checkmark: chrome.runtime.getURL('img/checkmark.png'),
    check: function(push, check) {
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
        pushes.updateLists();

        for (var i = pushes.list.length - 1; i >= 0; i--) {
            pushes.check(pushes.list[i], check);
        }

        pushes.refresh();
    },

    pDelete: function(all) {
        pushes.refresh();

        var deleteCounter = 0;

        try {
            var toDel = all ? pushes.list : pushes.checkedList,
                len = toDel.length;

            if (len) {
                if (len > 5 && !confirm(
                        'Are you sure you would like to delete ' +
                        (all ? 'all' : 'these %').replace('%', len) + ' pushes?\n\n' +
                        'This cannot be canceled nor undone.')
                    ) {
                    return;
                }

                var deleteMore = function() {
                    pushes.refresh();

                    toDel = all ? pushes.list : pushes.checkedList

                    if (!toDel.length) {
                        log('Deletion complete. Deleted ' + deleteCounter + ' pushes.');
                        pushes.refresh();
                        return;
                    }

                    for (var i = toDel.length - 1; i >= 0; i--) {
                        pushes.getCloseButton(toDel[i]).click();

                        deleteCounter++;
                    }

                    pushes.refresh();

                    window.setTimeout(deleteMore, 2000);
                };

                deleteMore();
            }
        } catch (ex) {
            log('Deletion failed. Error: ', ex);
            throw ex;
        }
    }
};

buttons = {
    selectVisible: null,
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

        //Button divider
        var buttonsDiv = document.createElement('div');
        buttonsDiv.id = 'pushbully-box';

        //BUTTONS
        var btnTemplate = document.createElement('button'),
            btnRefreshBoxes;
        btnTemplate.className = 'btn pushbully-button';

        //Select all button
        buttons.selectVisible = btnTemplate.cloneNode();
        buttons.selectVisible.innerText = 'Select Visible';
        buttons.selectVisible.id = 'select-visible-button';

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

        buttonsDiv.appendChild(buttons.selectVisible);
        buttonsDiv.appendChild(buttons.deleteSelected);
        buttonsDiv.appendChild(btnRefreshBoxes);
        buttonsDiv.appendChild(buttons.deleteAll);

        main.pushListDiv.insertAdjacentElement('beforeBegin', buttonsDiv);

        log('Button box and buttons injected.');

        return true;
    },

    update: function() {
        var allLength = pushes.list.length;

        if (allLength && pushes.checkedList.length) {
            buttons.deleteSelected.innerText = 'Delete Selected (' + pushes.checkedList.length + ')';

            buttons.selectVisible.innerText = 'Deselect All';
            buttons.selectVisible.title = 'Click to deselect all selected pushes.';

            buttons.selectVisible.onclick = function() {
                if (buttons.selectVisible.disabled) { return; }

                pushes.doSelect(false);
            };
        } else {
            buttons.deleteSelected.innerText = 'Delete Selected';

            buttons.selectVisible.innerText = 'Select Visible' + (allLength ? ' (' + allLength + ')' : '');
            buttons.selectVisible.title = 'Click to select all loaded pushes (scroll to load more).';

            buttons.selectVisible.onclick = function() {
                if (buttons.selectVisible.disabled) { return; }

                pushes.doSelect(true);
            };
        }

        buttons.selectVisible.disabled = buttons.deleteAll.disabled = !allLength;
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

            pushes.refresh(true);
        } else {
            log('something else was clicked - push:');

            pushes.highlight(push, !push.classList.contains('highlit'));
        }
    },

    reset: function() {
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

                var doRefresh = function() {
                    window.clearTimeout(timeout);

                    timeout = window.setTimeout(pushes.refresh, 700);
                };

                main.observer = new main.MyObserver(function(mutation) {
                    pushes.refresh();
                    if (mutation.addedNodes) {
                        for (var nodeEntry in mutation.addedNodes) {
                            if (mutation.addedNodes[nodeEntry].className == 'push') {
                                doRefresh();
                                return;
                            }
                        }
                    } else if (mutation.removedNodes) {
                        for (var nodeEntry in mutation.removedNodes) {
                            if (mutation.removedNodes[nodeEntry].className == 'push') {
                                doRefresh();
                                return;
                            }
                        }
                    }
                });

                main.observer.observe(main.pushListDiv, { childList: true });

                log('Initialize: Attached mutation observer to listen for new pushes.');

                window.setTimeout(pushes.refresh, 1000);

                return true;
            } catch (except) {
                log('Initialize: Could not attach mutation observer due to error:');

                log(except);

                throw except;
            }
        } catch (ex) {
            log(ex);
            throw ex;
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
                buttons.selectVisible.onclick();
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
                            pushes.check(highlit, !highlit.classList.contains('checked'));
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

window.setTimeout(function() {
    if (main.reset()) {
        main.pushListDiv.addEventListener('keydown', main.handleKeyDown, true);
    } else {
        log('Did not reset. Canceling');
    }
}, 3000);

//TODO: Create options page (add ALL the advanced mo'fo'in' options)

//TODO: Put hotkeys and help in the options page

//TODO: Add Pushbully logo to page (possibly add a link to the options page on the Pushbullet page)

//TODO: Add tooltips to buttons and panels and pushes for hotkeys and tips

//TODO: Handle propogation