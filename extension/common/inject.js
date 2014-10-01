(function() {
    var main, pushes, buttons;

    var log = function(toLog) {
        if (typeof (toLog) === 'string') {
            console.log('PBULLY: ' + toLog);
        }
        else {
            console.log(toLog);
        }
    };

    pushes = {
        list: [], checkedList: [],
        checkmark: chrome.runtime.getURL('common/images/checkmark.png'),

        checkThis: function(e) { console.log(e); pushes.check(this); },
        clickPush: function(e) { console.log(e); pushes.highlight(this); },

        initialize: function(push) {
            if (!push.classList.contains('pushbully')) {
                push.classList.add('pushbully');
                push.onclick = pushes.clickPush;
            }
        },
        refresh: function(deselect, partial) {
            pushes.list = document.getElementsByClassName('push');

            if (!partial) {
                pushes.checkedList = document.getElementsByClassName('pushbully checked');

                for (var p = pushes.list.length - 1; p >= 0; --p) {
                    pushes.initialize(pushes.list[p], p);
                }
            }

            if (deselect) { pushes.deselectAll(); }

            buttons.update();
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
        highlight: function(push) {
            var isHL = push.classList.contains('highlit'),
                highlit = document.getElementsByClassName('highlit');

            for (var d = 0, len = highlit.length; d < len; d++) {
                highlit[d].classList.remove('highlit');
            }

            if (!isHL) {
                push.classList.add('highlit');

                pushes.scrollIntoView(push);
            }

            return isHL;
        },

        check: function(push, check, bulk) {
            var isChecked, cBox, title, thumbnail;

            if (push.classList.contains('pushbully')) { isChecked = push.classList.contains('checked'); }
            else { pushes.initialize(push); }

            cBox = push.getElementsByClassName('profile-pic')[0];

            check = push.classList.toggle('checked', check === undefined ? !isChecked : check);

            if (check) {
                title = 'Click to save this push from certain doom.';
                thumbnail = cBox.getAttribute('src');
                cBox.setAttribute('data-prevsrc', thumbnail);
                cBox.setAttribute('src', pushes.checkmark);
            } else {
                title = 'Click to mark this push for destruction.';
                thumbnail = cBox.getAttribute('data-prevsrc');
                if (thumbnail) {
                    cBox.setAttribute('src', thumbnail);
                    cBox.removeAttribute('data-prevsrc');
                }
            }

            cBox.setAttribute('title', title);

            if (!bulk) {
                pushes.refresh();
                log(push);
            }

            return check;
        },

        doSelect: function(check) {
            for (var i = pushes.list.length - 1; i >= 0; i--) {
                pushes.check(pushes.list[i], check, true);
            }
            pushes.refresh();
        },
        selectAll: function() { pushes.doSelect(true); },
        deselectAll: function() { pushes.doSelect(false); },

        pDelete: function(all) { //selection = 'checked' || selection = 'all'
            pushes.refresh();

            var toDelete = all ? pushes.list : pushes.checkedList,
                length = toDelete.length;

            if (length > 5) {
                var stop =
                    !confirm(
                        'Are you sure you would like to delete ' +
                            (all ? 'all %+' : 'these %').replace('%', length) + ' pushes?\n\n' +
                        'This cannot be canceled nor undone.'
                    )
                ;

                if (stop) { return; }
            }

            var i, deleteCounter = 0;

            var doDelete = function() {
                pushes.refresh();

                toDelete = all ? pushes.list : pushes.checkedList;
                length = toDelete.length;

                if (length > 0) {
                    for (i = length - 1; i >= 0; i--) {
                        toDelete[i].getElementsByClassName('push-close')[0].click();
                        deleteCounter++;
                    }

                    if (all) {
                        window.setTimeout(doDelete, 500);

                        return;
                    }
                }

                log('Deletion complete. Deleted ' + deleteCounter + ' pushes.');

                window.setTimeout(function() { pushes.refresh(false, true); }, 500);
            };

            doDelete();
        },
        deleteAll: function() { pushes.pDelete(true); },
        deleteSelected: function() { pushes.pDelete(false); }
    };

    buttons = {
        selectAll: null, deleteSelected: null, deleteAll: null,

        inject: function() {
            log('Injecting buttons...');

            if (!main.pushListDiv) {
                log('buttons.inject: main.pushListDiv not found. Stopping inject...');

                return false;
            }

            var pushFrame = document.getElementsByClassName('pushframe')[0],
                buttonsDiv = document.getElementById('pushbully-button-box');

            if (!pushFrame) {
                log('buttons.inject: pushFrame not found. Stopping inject...');

                return false;
            }

            if (buttonsDiv) {
                buttonsDiv.parentElement.removeChild(buttonsDiv);

                log('buttons.inject: Buttons div deleted.');
            } else {
                log('buttons.inject: Buttons div doesn\'t exist.');
            }

            log('buttons.inject: Injecting buttons...');

            //Button divider
            buttonsDiv = document.createElement('div');
            buttonsDiv.id = 'pushbully-button-box';
            pushFrame.insertAdjacentElement('afterEnd', buttonsDiv);

            log('buttonsDiv:');
            log(buttonsDiv);

            //BUTTONS
            var btnClassName = 'btn pushbully-button';

            //Refresh boxes button
            var btnRefreshBoxes = document.createElement('button');
            btnRefreshBoxes.innerText = 'Refresh Boxes';
            btnRefreshBoxes.className = btnClassName;
            btnRefreshBoxes.id = 'refresh-boxes-button';
            btnRefreshBoxes.title = 'Sometimes pushes won\'t have checkboxes on them. Click this to fix that.';
            btnRefreshBoxes.onclick = function() { pushes.refresh(true); };

            //Delete all pushes.list button
            buttons.deleteAll = document.createElement('button');
            buttons.deleteAll.innerText = 'Delete All';
            buttons.deleteAll.className = btnClassName;
            buttons.deleteAll.id = 'delete-all-button';
            buttons.deleteAll.title = 'Click to delete all of your pushes.';
            buttons.deleteAll.onclick = pushes.deleteAll;

            //Select all button
            buttons.selectAll = document.createElement('button');
            buttons.selectAll.innerText = 'Select All';
            buttons.selectAll.className = btnClassName;
            buttons.selectAll.id = 'select-all-button';

            //Delete selected button
            buttons.deleteSelected = document.createElement('button');
            buttons.deleteSelected.innerText = 'Delete Selected';
            buttons.deleteSelected.className = btnClassName;
            buttons.deleteSelected.id = 'delete-selected-button';
            buttons.deleteSelected.title = 'Click to delete all selected pushes.';
            buttons.deleteSelected.onclick = pushes.deleteSelected;

            buttonsDiv.appendChild(buttons.selectAll);
            buttonsDiv.appendChild(buttons.deleteSelected);

            buttonsDiv.appendChild(btnRefreshBoxes);
            buttonsDiv.appendChild(buttons.deleteAll);

            log('Button box and buttons injected.');

            return true;
        },

        update: function() {
            if (pushes.list.length && pushes.checkedList.length) {
                buttons.deleteSelected.innerText = 'Delete Selected (' + pushes.checkedList.length + ')';

                buttons.selectAll.onclick = pushes.deselectAll;
                buttons.selectAll.innerText = 'Deselect All';
                buttons.selectAll.title = 'Click to deselect all selected pushes.';
            } else {
                buttons.deleteSelected.innerText = 'Delete Selected';

                buttons.selectAll.onclick = pushes.selectAll;
                buttons.selectAll.innerText = 'Select All' + (pushes.list.length ? ' (' + pushes.list.length + ')' : '');
                buttons.selectAll.title = 'Click to select all pushes on the first page.';
            }

            buttons.selectAll.disabled = buttons.deleteAll.disabled = !pushes.list.length;
            buttons.deleteSelected.disabled = !pushes.checkedList.length;
        }
    };

    main = {
        doReset: function() {
            main.pushListDiv = document.getElementsByClassName('physics')[0];

            if (buttons.inject()) { pushes.refresh(); }
        },
        reset: function(iDelay) {
            if (iDelay) {
                window.setTimeout(main.doReset, iDelay);
            } else {
                main.doReset();
            }
        },

        initialize: function() {
            main.reset();

            try {
                var MyObserver = window.MutationObserver || window.WebKitMutationObserver || new MutationObserver();

                var observer = new MyObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.addedNodes) {
                            var count = 0, node;

                            for (var i = 0, l = mutation.addedNodes.length; i < l; i++) {
                                node = mutation.addedNodes[i];

                                if (node.className === 'push') {
                                    log('Mutation: New push found (count = ' + (count++) + '). Propogating...');
                                }
                            }
                        }
                    });
                });

                observer.observe(main.pushListDiv, {
                    childList: true,
                    subtree: true
                });

                log('Initialize: Attached mutation observer to listen for new pushes.');
            } catch (except) {
                log(except);
                log('Initialize: Could not attach mutation observer due to error:');
            }

            var wHist = window.history,
                oldPushState = wHist.pushState;

            wHist.pushState = function(state) {
                log('PushState: wHist.pushState state changed. Resetting...');

                if (wHist.onpushstate) {
                    wHist.onpushstate({ state: state });
                }

                main.reset(500);

                return oldPushState.apply(wHist, arguments);
            };

            window.onhashchange =
                window.onpopstate =
                    window.onpushstate = function() { main.reset(500); };

            log('Initialize: Attached pop state listener to listen for page change.');

            /*
            window.onkeydown = handleKeyDown;
            */
        }
    };

    main.initialize();
})();

//TODO: Create options page (add ALL the advanced mo'fo'in' options)

//TODO: Put hotkeys and help in the options page

//TODO: Add Pushbully logo to page (possibly add a link to the options page on the Pushbullet page)

//TODO: Add tooltips to buttons and panels and pushes for hotkeys and tips