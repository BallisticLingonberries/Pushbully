(function() {
    var options, main, pushes, buttons, inProg = false, keyList = [];

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
            if (sIndex === -1) {
                keyList.push(sender);
            }

            inProg = true;
        } else {
            if (sIndex !== -1) {
                keyList.splice(sIndex, 1);
            }

            if (keyList.length === 0) {
                inProg = false;
            }
        }

        log('| sender:' + sender + ' | isProc: ' + isProc + ' || inProg: ' + inProg + ' | keyList:');
        log(keyList);
    };

    options = {
        enableKBShortcuts: localStorage.getItem('enableKBShortcuts') != 'false',
        onlySelfSent: localStorage.getItem('onlySelfSent') == 'true',
        notFiles: localStorage.getItem('notFiles') == 'true',

        set: function(option, value) {
            options[option] = value;

            localStorage.setItem(option, value.toString());
        }
    };

    pushes = {
        list: [],
        checkedList: [],
        checkmark: chrome.runtime.getURL('common/images/checkmark.png'),

        clickPush: function(e) {
            if (e.toElement.classList.contains('profile-pic')) {
                console.log('profile pic clicked');
                pushes.check(this, !this.classList.contains('checked'));
            }
            else if (e.toElement.classList.contains('push-close')) {
                console.log('close button clicked');
                window.setTimeout(function() {
                    pushes.refresh();
                }, 300);
            } else {
                console.log('somewhere else clicked');
                //pushes.highlight(this);
            }
        },

        initialize: function(push) {
            if (!push.classList.contains('pushbully')) {
                push.classList.add('pushbully');

                push.onclick = pushes.clickPush;

                push.getElementsByClassName('profile-pic')[0].setAttribute('title', 'Click to mark this push for deletion.');
            }
        },
        refresh: function(deselect, partial) {
            setProcessing('refresh', true);
            pushes.list = document.getElementsByClassName('push');

            if (!partial) {
                pushes.checkedList = document.getElementsByClassName('pushbully checked');

                for (var p = pushes.list.length - 1; p >= 0; --p) {
                    pushes.initialize(pushes.list[p], p);
                }
            }

            if (deselect) {
                pushes.deselectAll();
            }

            buttons.update();
            setProcessing('refresh', false);
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
            var highlit = document.getElementsByClassName('highlit'),
                isHL = push ? push.classList.contains('highlit') : true;

            for (var d = 0, len = highlit.length; d < len; d++) {
                highlit[d].classList.remove('highlit');
            }

            if (!isHL) {
                push.classList.add('highlit');

                pushes.scrollIntoView(push);
            }
        },

        check: function(push, check, bulk) {
            var cBox, title, thumbnail;

            pushes.initialize(push);

            cBox = push.getElementsByClassName('profile-pic')[0];

            push.classList.toggle('checked', check);

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

            if (bulk) { return check; }

            pushes.refresh();
            log(push);
        },

        doSelect: function(check) {
            for (var i = pushes.list.length - 1; i >= 0; i--) {
                pushes.check(pushes.list[i], check, true);
            }

            pushes.refresh();
        },
        selectAll: function() {
            pushes.doSelect(true);
        },
        deselectAll: function() {
            pushes.doSelect(false);
        },

        pDelete: function(all) { //selection = 'checked' || selection = 'all'
            setProcessing('delete', true);

            pushes.refresh();

            var toDelete = all ? pushes.list : pushes.checkedList,
                length = toDelete.length;

            if (length > 5) {
                if (!confirm('Are you sure you would like to delete ' +
                                (all ? 'all %+' : 'these %').replace('%', length) + ' pushes?\n\n' +
                            'This cannot be canceled nor undone.')) { return; }
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

                window.setTimeout(function() { pushes.refresh(); }, 500);

                setProcessing('delete', false);
            };

            doDelete();
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
                // buttonsDiv.parentElement.removeChild(buttonsDiv);
                // log('buttons.inject: Buttons div deleted.');

                log('buttons.inject: Buttons div already exists.');

                return true;
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
            btnRefreshBoxes.onclick = pushes.refresh; //Sends event as first parameter; means the first paramater is true 

            //Delete all pushes.list button
            buttons.deleteAll = document.createElement('button');
            buttons.deleteAll.innerText = 'Delete All';
            buttons.deleteAll.className = btnClassName;
            buttons.deleteAll.id = 'delete-all-button';
            buttons.deleteAll.title = 'Click to delete all of your pushes, starting from the current page on.';
            buttons.deleteAll.onclick = pushes.pDelete; //Sends event as first parameter; means the first paramater is true 

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
        pushListDiv: null,
        doReset: function() {
            main.pushListDiv = document.getElementsByClassName('physics')[0];

            if (buttons.inject()) {
                pushes.refresh();

                return true;
            }
        },
        reset: function(iDelay) {
            if (iDelay) {
                window.setTimeout(main.doReset, iDelay);
            } else {
                return main.doReset();
            }
        },

        initialize: function() {
            if (!main.reset()) {
                log('Did not reset. Canceling');

                return false;
            }

            try {
                var
                    MyObserver = window.MutationObserver || window.WebKitMutationObserver || new MutationObserver(),

                    count, offset, node,

                    handleMutation = function(nodes, chng) {
                        for (var i = nodes.length - 1; i >= 0; i--) {
                            node = nodes[i];

                            if (node.classList && node.classList.contains('push')) {
                                log('Push mutation: Count = ' + (++count) + ' | Offset = ' + offset);
                            }

                            offset += chng;
                        }
                    },

                    observer = new MyObserver(function(mutations) {
                        count = 0; offset = 0; node = null;
                        mutations.forEach(function(mutation) {
                            if (mutation.addedNodes) {
                                handleMutation(mutation.addedNodes, +1);
                            }

                            if (mutation.removedNodes) {
                                handleMutation(mutation.removedNodes, -1);
                            }
                        });
                        if (count) {
                            pushes.refresh();
                        }
                    })
                ;

                observer.observe(
                    main.pushListDiv,
                    {
                        childList: true,
                        subtree: true
                    }
                );

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
                    window.onpushstate = function() {
                        main.reset(500);
                    };

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