(function() {
    var options, main, pushes, buttons;

    var observer, inProg = false;

    var keyList = [], checkedPushIDs = [];

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

        //log('| sender:' + sender + ' | isProc: ' + isProc + ' || inProg: ' + inProg + ' | keyList:');
        //log(keyList);
    };

    options = {
        enableKBShortcuts: localStorage.getItem('enableKBShortcuts') != 'false',
        onlySelfSent: localStorage.getItem('onlySelfSent') == 'true',
        notFiles: localStorage.getItem('notFiles') == 'true',
        lockedPushes: localStorage.getItem('lockedPushes') || [],

        set: function(option, value) {
            options[option] = value;

            localStorage.setItem(option, value.toString());
        }
    };

    pushes = {
        list: [],
        checkedList: [],
        checkmark: chrome.runtime.getURL('common/images/checkmark.png'),

        initialize: function(push) {
            var cBox = push.getElementsByClassName('profile-pic')[0], disabled;

            if (options.lockedPushes) {
                var indx = options.lockedPushes.indexOf(push.id);

                disabled = push.classList.toggle('locked', indx != -1);
            }

            if (!push.classList.contains('pushbully')) {
                push.classList.add('pushbully');

                if (cBox) {
                    if (disabled) {
                        cBox.setAttribute('title', 'This push is locked.');
                    } else {
                        cBox.setAttribute('title', 'Click to mark this push for deletion.');
                    }
                }
            }

            return cBox;
        },

        getCloseButton: function(push) {
            return push.getElementsByClassName('push-close')[0];
        },

        refresh: function(deselect, partial) {
            setProcessing('refresh', true);

            pushes.list = document.getElementsByClassName('push');

            if (!partial) {
                pushes.checkedList = document.getElementsByClassName('pushbully checked');

                for (var p = pushes.list.length - 1; p >= 0; --p) {
                    pushes.initialize(pushes.list[p]);
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

        check: function(push, check) {
            if (check == push.classList.contains('checked')) { return; }

            var cBox, title, thumbnail;

            cBox = pushes.initialize(push);

            if (check) {
                title = 'Click to save this push from certain doom.';
                thumbnail = cBox.getAttribute('src');

                cBox.setAttribute('src', pushes.checkmark);
                cBox.setAttribute('data-prevsrc', thumbnail);

                checkedPushIDs.push(push);
            } else {
                title = 'Click to mark this push for destruction.';
                thumbnail = cBox.getAttribute('data-prevsrc');

                if (thumbnail) {
                    cBox.setAttribute('src', thumbnail);
                    cBox.setAttribute('data-prevsrc', '');
                }

                var indx = checkedPushIDs.indexOf(push.id);
                if (indx !== -1) { checkedPushIDs.splice(indx, 1); }
            }

            push.classList.toggle('checked', check);
            cBox.setAttribute('title', title);
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

                setProcessing('delete', true);

                toDelete = all ? pushes.list : pushes.checkedList;
                length = toDelete.length;

                if (length > 0) {
                    for (i = length - 1; i >= 0; i--) {
                        pushes.getCloseButton(toDelete[i]).click();

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
                log('buttons.inject: main.pushListDiv (push_cards) not found. Stopping inject...');

                return false;
            } else if (document.getElementById('pushbully-button-box')) {
                log('buttons.inject: Buttons div already exists.');

                return true;
            }

            log('buttons.inject: Injecting buttons...');

            //Button divider
            var buttonsDiv = document.createElement('div');
            buttonsDiv.id = 'pushbully-button-box';

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
            if (pushes.list.length && pushes.checkedList.length) {
                buttons.deleteSelected.innerText = 'Delete Selected (' + pushes.checkedList.length + ')';

                buttons.selectAll.innerText = 'Deselect All';
                buttons.selectAll.title = 'Click to deselect all selected pushes.';

                buttons.selectAll.onclick = pushes.deselectAll;
            } else {
                buttons.deleteSelected.innerText = 'Delete Selected';

                buttons.selectAll.innerText = 'Select All' + (pushes.list.length ? ' (' + pushes.list.length + ')' : '');
                buttons.selectAll.title = 'Click to select all pushes on the current page.';

                buttons.selectAll.onclick = pushes.doSelect;
            }

            buttons.selectAll.disabled = buttons.deleteAll.disabled = !pushes.list.length;
            buttons.deleteSelected.disabled = !pushes.checkedList.length;
        }
    };

    main = {
        pushListDiv: null,

        pushListClick: function(e) {
            var
                elem,
                push = (elem = e.toElement),
                i = 0
            ;

            while (i <= 3) {
                if ((push = push.parentElement).classList.contains('push')) {
                    i = null;
                    break;
                }

                i++;
            }

            if (i !== null) { return; }

            if (elem.classList.contains('profile-pic')) {
                console.log('profile pic clicked');

                pushes.check(push, !push.classList.contains('checked'));

                pushes.refresh();
            }
            else if (elem.classList.contains('push-close')) {
                console.log('close button clicked');

                /*
                window.setTimeout(function() {
                    pushes.refresh();
                }, 300);
                */
            } else {
                console.log('somewhere else clicked');

                /*pushes.highlight(this);*/
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
                    var MyObserver = window.MutationObserver || window.WebKitMutationObserver || new MutationObserver(),

                        count, offset, node,

                        handleMutation = function(nodes, chng) {
                            log('HandleMutation fired | nodes:'); log(nodes);

                            for (var i = nodes.length - 1; i >= 0; i--) {
                                node = nodes[i];
                                if (node.className && node.className === 'push') {
                                    log('Push mutation: Count = ' + (++count) + ' | Offset = ' + (offset += chng));
                                    log(node);
                                }
                            }
                        }
                    ;

                    observer = new MyObserver(function(mutations) {
                        log('mutation observer fired');

                        count = 0; offset = 0; node = null;
                        mutations.forEach(function(mutation) {
                            log('Mutation foreach entry');

                            if (mutation.addedNodes) {
                                handleMutation(mutation.addedNodes, +1);
                            }

                            if (mutation.removedNodes) {
                                handleMutation(mutation.removedNodes, -1);
                            }
                        });

                        log('final offset: ' + offset + ' | final count: ' + count);

                        pushes.refresh();
                    });

                    observer.observe(
                        main.pushListDiv,
                        {
                            childList: true,
                            subtree: true
                        }
                    );

                    log('Initialize: Attached mutation observer to listen for new pushes.');
                } catch (except) {
                    log('Initialize: Could not attach mutation observer due to error:');

                    log(except);
                }

                return true;
            } catch (ex) { return false; }
            finally { setProcessing('doreset', false); }
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