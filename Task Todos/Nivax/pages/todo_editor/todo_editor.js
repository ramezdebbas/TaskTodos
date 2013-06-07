var _editNum, tempID;

var listID;

var _tasks, taskArray;

var charLimit = App.PurchaseStatus.charLimit();

(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/todo_editor/todo_editor.html", {

        ready: function (element, options) {

            var pageAppBar = document.getElementById("editor_AppBar").winControl;

            pageAppBar.sticky = true;

            pageAppBar.hideCommands([RemCommand, CopyCommand, RemindCommand]);

            var cmdAdd = pageAppBar.getCommandById("AddCommand");
            cmdAdd.onclick = function (e) {
                document.getElementById("Add_Flyout").winControl.show(this);
            };

            var cmdPin = document.getElementById("PinCommand");
            cmdPin.onclick = function (e) {
                pinTile(cmdPin);
            };

            var addTaskInput = document.getElementById("addTaskInput");
            addTaskInput.onkeypress = function (e) {
                if (e.keyCode == 13) {
                    addTask();
                    return false;
                }
            };

            var cmdDel = pageAppBar.getCommandById("DelCommand");
            cmdDel.onclick = function (e) {
                document.getElementById("Del_Flyout").winControl.show(this);
            };

            var cmdRem = pageAppBar.getCommandById("RemCommand");
            cmdRem.onclick = function (e) {
                var lvSelection = document.getElementById("editor_listview").winControl.selection;
                lvSelection.getItems().done(
                    function (selectedTasks) {
                        removeScheduledNotification();
                        deleteTask(selectedTasks);
                    }
                    );
            };

            var _to_copy_text;

            var cmdCopy = pageAppBar.getCommandById("CopyCommand");
            cmdCopy.onclick = function () {
                var lvSelection = document.getElementById("editor_listview").winControl.selection;
                lvSelection.getItems()
                    .done(
                        function (selectedTasks) {
                            _to_copy_text = selectedTasks[0].data.alt;
                            document.getElementById("completeSelection").innerText = _to_copy_text;
                        }
                    );
                document.getElementById("Copy_Flyout").winControl.show(this);
            };

            var cmdRemind = pageAppBar.getCommandById("RemindCommand");
            cmdRemind.onclick = function () {
                showTaskScheduleFlyout(this);
            };

            var copyTaskButton = document.getElementById("copyTaskButton");
            copyTaskButton.onclick = function () {
                window.clipboardData.setData("Text", _to_copy_text);
            };

            var addTaskButton = document.getElementById("addTaskButton");
            addTaskButton.onclick = function (e) {
                addTask();
            };


            var delListButton = document.getElementById("delListButton");
            delListButton.onclick = function (e) {
                deleteList();
            };

            var setReminderBut = document.getElementById("setReminderBut");
            setReminderBut.onclick = function (e) {
                addToast();
                removeReminderBut.disabled = false;
            };

            var removeReminderBut = document.getElementById("removeReminderBut");
            removeReminderBut.onclick = function (e) {
                removeScheduledNotification()
                this.disabled = true;
            }

            function deleteList() {

                App.FileSystem.readDataFile().done(
                    function (ex) {


                        var res = (new DOMParser()).parseFromString(ex, "text/xml");
                        var _all_to_dos = res.getElementsByTagName("todos")[0];
                        var _allItemsArray = _all_to_dos.getElementsByTagName("item");

                        for (var counter = 0; counter < _allItemsArray.length; counter++) {

                            var itemID = _allItemsArray[counter].getElementsByTagName("id")[0].childNodes[0].nodeValue;

                            if (itemID == _editNum) {
                                tempID = counter;
                                break;
                            }

                        }

                        _all_to_dos.removeChild(_allItemsArray[tempID]);
                        var localState = WinJS.Application.local;
                        localState.writeText("notes.xml", (new XMLSerializer()).serializeToString(res)).done(
                            function () {
                                if (options && options.second) {
                                    WinJS.Navigation.navigate("/pages/home/home.html", { noback: true });
                                } else {
                                    WinJS.Navigation.back();
                                }
                            });

                        var notifications = Windows.UI.Notifications;
                        var toastNotifier = notifications.ToastNotificationManager.createToastNotifier();
                        var _allToasts = toastNotifier.getScheduledToastNotifications();
                        _allToasts.forEach(
                            function (_toast) {
                                if (parseInt(_toast.id.substring(0, _toast.id.indexOf("."))) == _editNum) {
                                    toastNotifier.removeFromSchedule(_toast);
                                }
                            }
                        );


                    });

            }



            _editNum = App.UI.current;

            App.FileSystem.readDataFile().done(
                function (ex) {


                    var res = (new DOMParser()).parseFromString(ex, "text/xml");

                    try {
                        var _items = res.getElementsByTagName("todos")[0].getElementsByTagName("item");

                        var _item;

                        for (var x = 0; x < _items.length; x++) {
                            if (_items[x].getElementsByTagName("id")[0].childNodes[0].nodeValue == _editNum) {
                                _item = _items[x];
                                tempID = x;
                                listID = x;
                                checkTile(cmdPin);
                                updateProgress();
                                break;
                            } else {
                                tempID = undefined;
                            }
                        }

                        if (options && options.second) {
                            if (tempID == undefined || tempID == null) {
                                WinJS.Navigation.navigate("/pages/home/home.html", { noback: true });
                                return false;
                            }
                        }

                        var checkListTitle = _item.getElementsByTagName("title")[0].childNodes[0].nodeValue;

                        if (_trial_App && checkListTitle.length > charLimit) {
                            WinJS.Navigation.back();
                            var newError = new WinJS.ErrorFromName("Title", "Title is longer than " + charLimit + " chars which is not allowed in trial version");
                            throw newError;
                        }

                        document.getElementById("listTitle").value = checkListTitle;

                        _tasks = _item.getElementsByTagName("task");

                        taskArray = [];

                        for (var count = 0; count < _tasks.length; count++) {

                            if (!_tasks[count].childNodes[0]) {
                                WinJS.Navigation.back();
                                var newError = new WinJS.ErrorFromName("No Task", "You can\'t do an empty task!");
                                throw newError;
                            }

                            var totalString = _tasks[count].childNodes[0].nodeValue;

                            var tempString = (totalString.length > 17) ? totalString.substr(0, 17) + "..." : totalString;

                            if (_trial_App && totalString.length > charLimit) {
                                WinJS.Navigation.back();
                                var newError = new WinJS.ErrorFromName("Long Task", "Task name is too long. You can purchase the app for not displaying this message again!");
                                throw newError;
                            }
                            if (!totalString.charAt(0)) {
                                WinJS.Navigation.back();
                                var newError = new WinJS.ErrorFromName("No Task", "Task name is empty");
                                throw newError;
                            }


                            taskArray[count] = {
                                text: tempString,
                                tooltip: App.UI.convertToString(totalString),
                                alt: totalString,
                            }

                            if (_tasks[count].getAttribute("done") == "yes") {
                                taskArray[count].complete = 1;
                                taskArray[count].ifDone = "taskItems doneYes";
                            } else {
                                taskArray[count].complete = 0;
                                taskArray[count].ifDone = "taskItems doneNo";
                            }


                        }

                        App.FileSystem.data._taskArray = new WinJS.Binding.List(taskArray);

                        var lv;
                        var list = App.FileSystem.data._taskArray;
                        lv = document.querySelector("#editor_listview").winControl;
                        lv.itemDataSource = list.dataSource;
                        lv.itemTemplate = document.querySelector("#editor_template");

                        if (Windows.UI.ViewManagement.ApplicationView.value == viewStates.snapped) {
                            document.querySelector("#editor_listview").winControl.layout = new WinJS.UI.ListLayout();
                        } else {
                            document.querySelector("#editor_listview").winControl.layout = new WinJS.UI.GridLayout();
                        }

                        lv.onselectionchanged = function () {
                            lv.selection.getItems().done(
                                function (selectedTasks) {

                                    var editor_AppBar = document.getElementById("editor_AppBar").winControl;

                                    if (selectedTasks.length == 0) {
                                        try {
                                            editor_AppBar.hideCommands([RemCommand, CopyCommand, RemindCommand]);
                                        } catch (e) {
                                            null;
                                        }
                                    } else {
                                        if (selectedTasks.length == 1) {
                                            editor_AppBar.showCommands([RemCommand, CopyCommand]);
                                            if (!_trial_App && Windows.UI.ViewManagement.ApplicationView.value != Windows.UI.ViewManagement.ApplicationViewState.snapped) {
                                                editor_AppBar.showCommands([RemindCommand]);
                                            }
                                            editor_AppBar.show();
                                        } else {
                                            try {
                                                editor_AppBar.showCommands([RemCommand]);
                                                editor_AppBar.hideCommands([CopyCommand, RemindCommand]);
                                                editor_AppBar.show();
                                            } catch (e) {
                                                null;
                                            }
                                        }
                                    }
                                }
                                );
                        };

                        //Style
                        applyTheme();


                    }
                    catch (JSError) {
                        App.UI.errorMsg(JSError);
                    }

                },
                function () {
                    var newError = new WinJS.ErrorFromName("Oops!", "It seems like we couldn\'t find out saved data! If you think some external causes have done it! Please reset the app from settings charm");
                    App.UI.errorMsg(newError);
                },
                function () {
                    //document.getElementById("progress-bar").innerHTML = "<progress></progress>";
                    //document.getElementById("editor_AppBar").winControl.show();
                }
                );

            var savedBackButEvent = document.querySelector(".todo_editor #backAndSaveBut").onclick;

            document.querySelector(".todo_editor #backAndSaveBut").onclick = function () {
                var listTitleValue = document.querySelector("#listTitle").value;
                if (listTitleValue.charAt(0)) {
                    if (_trial_App && listTitleValue.length > charLimit) {
                        var newError = new WinJS.ErrorFromName("Title", "List tile must be less than or equal to " + charLimit + " chars! Or you can buy the full version of the app to unlock it!");
                        App.UI.errorMsg(newError);
                    } else {
                        writeTasks().done(
                            function () {
                                pushTile(App.FileSystem.data._taskArray);
                                savedBackButEvent();
                                if (options && options.second) {
                                    WinJS.Navigation.navigate("/pages/home/home.html");
                                } else {
                                    WinJS.Navigation.back();
                                }
                            }
                            );
                    }
                } else {
                    var newError = new WinJS.ErrorFromName("Title", "List title is required!");
                    App.UI.errorMsg(newError);
                }
            };



        },

        unload: function () {
            //App.UI.current = null;
            if (document.querySelector("#editor_listview")) {
                document.querySelector("#editor_listview").winControl.onselectionchanged = null;
            }
        },

        updateLayout: function (element, viewState, lastViewState) {
            if (viewState == viewStates.snapped) {
                qr("#editor_listview").winControl.layout = new WinJS.UI.ListLayout();
                qr("#editor_AppBar").winControl.hideCommands([RemindCommand]);

            } else {
                qr("#editor_listview").winControl.layout = new WinJS.UI.GridLayout();
            }
        }
    });

})();


//UPDATE PROGRESS BAR
function updateProgress() {
    App.FileSystem.data.bind("_taskArray", function (value) {

        var _tasks = getCompletedTasks(value, true);
        document.getElementById("listProgressBar").value = _tasks[0];
        document.getElementById("listProgressStatus").innerHTML = "total " + _tasks[1] + " &nbsp; &nbsp; completed " + _tasks[2] + " &nbsp; &nbsp; pending " + _tasks[3];

    });
}


function writeTasks() {
    return new WinJS.Promise(function (c, e) {
        App.FileSystem.readDataFile().done(
            function (ex) {

                try {

                    var XMLParser = new DOMParser();
                    var res = XMLParser.parseFromString(ex, "text/xml");

                    var _items = res.getElementsByTagName("todos")[0].getElementsByTagName("item");


                    for (var counter = 0; counter < _items.length; counter++) {

                        var itemID = _items[counter].getElementsByTagName("id")[0].childNodes[0].nodeValue;

                        if (itemID == _editNum) {
                            tempID = counter;
                            break;
                        }

                    }

                    res.getElementsByTagName("todos")[0].removeChild(_items[tempID]);

                    var newItem = res.createElement("item");

                    var newId = res.createElement("id");
                    newId.appendChild(res.createTextNode(itemID));

                    var listTitleValue = document.querySelector("#listTitle").value;

                    if (_trial_App && listTitleValue.length > charLimit) {
                        try {
                            var newError = new WinJS.ErrorFromName("Long Title", "Title name must be " + charLimit + " characters or shorter in trial version of the app!");
                            throw newError;
                        } catch (ErrorInError) { null; }
                    }

                    if (!listTitleValue.charAt(0)) {
                        try {
                            var newError = new WinJS.ErrorFromName("", "Title is required");
                            throw newError;
                        } catch (ErrorInError) { null; }
                    } else {

                        var newTitle = res.createElement("title");
                        newTitle.appendChild(res.createTextNode(listTitleValue));

                        newItem.appendChild(newId);
                        newItem.appendChild(newTitle);


                        for (var q = 0; q < App.FileSystem.data._taskArray.length; q++) {

                            var newTaskTitle = App.FileSystem.data._taskArray.getAt(q).alt;

                            if (_trial_App && newTaskTitle.length > charLimit) {
                                try {
                                    var newError = new WinJS.ErrorFromName("", "Task names are meant to be " + charLimit + " characters short in trial version of the app!");
                                    throw newError;
                                } catch (ErrorInError) { null; }
                            }

                            if (!newTaskTitle.charAt(0)) {
                                try {
                                    var newError = new WinJS.ErrorFromName("", "Task name is required");
                                    throw newError;
                                } catch (ErrorInError) { null; }
                            } else {

                                var newTask = res.createElement("task");

                                if (App.FileSystem.data._taskArray.getAt(q).complete == 1) {
                                    newTask.setAttribute("done", "yes");
                                } else {
                                    newTask.setAttribute("done", "no");
                                }



                                newTask.appendChild(res.createTextNode(App.FileSystem.data._taskArray.getAt(q).alt));

                                newItem.appendChild(newTask);
                            }

                        }

                        res.getElementsByTagName("todos")[0].appendChild(newItem);

                        var stringer = new XMLSerializer();
                        var xmlstring = stringer.serializeToString(res);

                        var localState = WinJS.Application.local;
                        localState.writeText("notes.xml", xmlstring).done(
                            function () {
                                c(xmlstring);
                            },
                            function () {
                                try {
                                    var newError = new WinJS.ErrorFromName("Write failed", "Couldn\'t save data. If the problem persists, Goto Settings and Reset the Application");
                                    throw newError;
                                } catch (ErrorInError) { null; }
                            }
                            );
                    }
                }
                catch (error) {
                    e(error);
                }
            });

    });
}

var writeDelay; //define writeDalay, used to setTimeout when writing to file

function taskClicked(taskSelf) { //function when a task from list is clicked

    window.clearTimeout(writeDelay);

    var taskIndex = document.querySelector("#editor_listview").winControl.currentItem.index;

    if (App.FileSystem.data._taskArray.getAt(taskIndex).complete == 1) {
        App.FileSystem.data._taskArray.getAt(taskIndex).complete = 0;
    } else {
        App.FileSystem.data._taskArray.getAt(taskIndex).complete = 1;
    }

    taskSelf.classList.toggle("doneYes");
    taskSelf.classList.toggle("doneNo");

    writeDelay = setTimeout(function () {
        writeTasks().done(
            function (str) {
                updateProgress();
                pushTile(App.FileSystem.data._taskArray);
            },
            function (error) {

            },
            function (str) {

            }
        );
    }, 100); //delay for reducing error chances

}


function deleteTask(args) {

    for (var x = 0; x < args.length; x++) {
        App.FileSystem.data._taskArray.splice(App.FileSystem.data._taskArray.indexOf(args[x].data), 1);
    }

    document.getElementById("editor_AppBar").winControl.hideCommands([RemCommand, CopyCommand, RemindCommand]);

    writeTasks().done(
            function () {
                //document.getElementById("detailedSelection").innerHTML = "";
                //document.getElementById("detailedSelection").style.visibility = "hidden";
                updateProgress();
                pushTile(App.FileSystem.data._taskArray);
            },
            function (error) {
                App.UI.errorMsg(error);
            },
            function () {
            }
            );


}


function addTask() {

    try {

        var textInput = document.querySelector(".todo_editor #addTaskInput").value;

        var tempString = (textInput.length > 17) ? textInput.substr(0, 17) + "..." : textInput;

        if (_trial_App && textInput.length > charLimit) {
            var newError = new WinJS.ErrorFromName("Long Task", charLimit + " characters or lesser task names allowed in trial version");
            throw newError;
        } else {
            if (textInput && textInput.charAt(0)) {
                App.FileSystem.data._taskArray.push({
                    text: tempString,
                    tooltip: App.UI.convertToString(textInput),
                    alt: textInput,
                    complete: 0,
                    ifDone: "taskItems doneNo"
                });
            } else {
                document.querySelector("#addTaskInput").blur();
                var newError = new WinJS.ErrorFromName("No Task", "You can\'t do an empty task!");
                throw newError;
            }
        }


        writeTasks().done(
            function (str) {
                document.getElementById("addTaskInput").value = "";
                document.getElementById("addTaskInput").focus();
                updateProgress();
                pushTile(App.FileSystem.data._taskArray);
            },
            function (error) {
                App.UI.errorMsg(error);
            },
            function (str) {
            }
            );
    } catch (JSError) {
        App.UI.errorMsg(JSError);
    }
}

function pinTile(cmdBut) {

    writeTasks().done(
        function () {

            var notifications = Windows.UI.Notifications;

            if (Windows.UI.StartScreen.SecondaryTile.exists("iNoteTile." + _editNum)) {
                var secondaryTile = Windows.UI.StartScreen.SecondaryTile("iNoteTile." + _editNum);
                var elementRect = cmdBut.getBoundingClientRect();
                var bounding = { x: elementRect.left, y: elementRect.top, width: elementRect.width, height: elementRect.height };
                secondaryTile.requestDeleteForSelectionAsync(bounding, Windows.UI.Popups.Placement.above).done(
                    function (isDeleted) {
                        if (isDeleted) {
                            checkTile(cmdBut);
                        }
                    }
                    );
            } else {

                var listTitle = document.querySelector("#listTitle").value;

                var secondaryTile = new Windows.UI.StartScreen.SecondaryTile("iNoteTile." + _editNum, listTitle, listTitle, "tileID=" + _editNum, Windows.UI.StartScreen.TileOptions.showNameOnLogo, new Windows.Foundation.Uri("ms-appx:///images/logo.png"));

                var elementRect = cmdBut.getBoundingClientRect();
                var bounding = { x: elementRect.left, y: elementRect.top, width: elementRect.width, height: elementRect.height };

                secondaryTile.requestCreateForSelectionAsync(bounding, Windows.UI.Popups.Placement.above).done(
                    function (isCreated) {
                        checkTile(cmdBut, true);
                    }
                    );

            }
        });

}

function checkTile(cmdBut, ifPush) {
    if (Windows.UI.StartScreen.SecondaryTile.exists("iNoteTile." + _editNum)) {
        cmdBut.winControl.icon = "unpin";
        cmdBut.winControl.label = "Unpin";
    } else {
        cmdBut.winControl.icon = "pin";
        cmdBut.winControl.label = "Pin to Start";
    }

    if (ifPush) {
        pushTile(App.FileSystem.data._taskArray);
    }
}

function pushTile(value) {
    if (Windows.UI.StartScreen.SecondaryTile.exists("iNoteTile." + _editNum)) {
        var tileXml = "<tile>"
        + "<visual>"
        + "<binding branding='name' template='TileSquareText01'>"
        + "<text id='1'>" + getCompletedTasks(value, false) + "</text>"
        + "<text id='2'>" + getTempContent(value, 0) + "</text>"
        + "<text id='3'>" + getTempContent(value, 1) + "</text>"
        + "<text id='4'>" + getTempContent(value, 2) + "</text>"
        + "<text id='5'>" + getTempContent(value, 3) + "</text>"
        + "</binding></visual></tile>";

        var tileDOM = new Windows.Data.Xml.Dom.XmlDocument();
        tileDOM.loadXml(tileXml);
        var tileNotification = new Windows.UI.Notifications.TileNotification(tileDOM);

        Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForSecondaryTile("iNoteTile." + _editNum).update(tileNotification);

    }
}

function getTempContent(value, n) {
    var content = "";
    if (value.getAt(n)) {
        content = value.getAt(n).alt;
    }
    return content;
}

function getCompletedTasks(value, percent) {
    var _totalTasks = value.length;
    var _completedTasks = 0;
    var _pendingTasks = 0;

    for (var x = 0; x < _totalTasks; x++) {
        if (value.getAt(x).complete == 1) {
            _completedTasks++;
        }
    }

    _pendingTasks = _totalTasks - _completedTasks;

    var _tasksPercentage = parseInt((_completedTasks / _totalTasks) * 100);

    if (percent) {
        return [_tasksPercentage, _totalTasks, _completedTasks, _pendingTasks];
    } else {
        return _completedTasks + "/" + _totalTasks;
    }
}

function showTaskScheduleFlyout(RmdBut) {
    var taskScheduleFlyout = qr("#Schedule_Flyout");
    var notifications = Windows.UI.Notifications;
    var toastNotifier = notifications.ToastNotificationManager.createToastNotifier();

    var lvSelection = qr("#editor_listview").winControl;
    lvSelection.selection.getItems()
        .done(
            function (selectedTasks) {
                var toastID = _editNum + "." + selectedTasks[0].index;
                var _allToasts = toastNotifier.getScheduledToastNotifications();
                var currentTime = new Date();
                qr("#Schedule_YY").value = currentTime.getFullYear();
                qr("#Schedule_MO").value = App.UI.displayInt(currentTime.getMonth() + 1);
                qr("#Schedule_DD").value = App.UI.displayInt(currentTime.getDate());
                qr("#Schedule_HH").value = (currentTime.getHours() % 12 == 0) ? 12 : App.UI.displayInt(currentTime.getHours() % 12);
                qr("#Schedule_TT").value = (currentTime.getHours() < 12) ? "AM" : "PM";
                qr("#Schedule_MM").value = App.UI.displayInt(currentTime.getMinutes());
                qr("#removeReminderBut").disabled = true;
                _allToasts.forEach(
                    function (_toast) {
                        if (_toast.id == toastID) {
                            qr("#Schedule_YY").value = _toast.deliveryTime.getFullYear();
                            qr("#Schedule_MO").value = App.UI.displayInt(_toast.deliveryTime.getMonth() + 1);
                            qr("#Schedule_DD").value = App.UI.displayInt(_toast.deliveryTime.getDate());
                            qr("#Schedule_HH").value = (_toast.deliveryTime.getHours() % 12 == 0) ? 12 : App.UI.displayInt(_toast.deliveryTime.getHours() % 12);
                            qr("#Schedule_TT").value = (_toast.deliveryTime.getHours() < 12) ? "AM" : "PM";
                            qr("#Schedule_MM").value = App.UI.displayInt(_toast.deliveryTime.getMinutes());
                            qr("#removeReminderBut").disabled = false;
                        }
                    }
                );

                taskScheduleFlyout.winControl.show(RmdBut);
            }
        );
}

function addToast() {
    var notifications = Windows.UI.Notifications;
    var toastNotifier = notifications.ToastNotificationManager.createToastNotifier();

    var lvSelection = document.getElementById("editor_listview").winControl;
    var taskNumber, taskText;
    lvSelection.selection.getItems().done(
        function (selectedTasks) {
            try {
                taskNumber = selectedTasks[0].index;
                taskText = selectedTasks[0].data.alt;

                var toastID = _editNum + "." + taskNumber;

                removeScheduledNotification();

                var currentTime = new Date();
                var yearSet = parseInt(qr("#Schedule_YY").value);
                var monthSet = parseInt(qr("#Schedule_MO").value);
                var daySet = parseInt(qr("#Schedule_DD").value);
                var _hoursSet = parseInt(qr("#Schedule_HH").value);
                var _dayMode = qr("#Schedule_TT").value;
                var hoursSet = (_dayMode == "PM") ? (_hoursSet == 12) ? _hoursSet : _hoursSet + 12 : _hoursSet % 12;
                var minutesSet = parseInt(qr("#Schedule_MM").value);
                var toastDate = new Date();
                toastDate.setFullYear(yearSet);
                toastDate.setMonth(monthSet - 1);
                toastDate.setDate(daySet);
                toastDate.setHours(hoursSet);
                toastDate.setMinutes(minutesSet);
                toastDate.setSeconds(0);

                var toastTemplate = notifications.ToastTemplateType.toastText02;
                var toastXml = notifications.ToastNotificationManager.getTemplateContent(toastTemplate);
                toastXml.getElementsByTagName("text")[0].appendChild(toastXml.createTextNode(taskText));
                toastXml.getElementsByTagName("text")[1].appendChild(toastXml.createTextNode(_hoursSet.toString() + ":" + minutesSet.toString() + " " + _dayMode));
                var toastNotification = new notifications.ScheduledToastNotification(toastXml, toastDate);
                toastNotification.id = toastID;
                toastNotifier.addToSchedule(toastNotification);
            } catch (Error) {
                var newError = new WinJS.ErrorFromName("Oops", "You may have entered time that has passed away");
                App.UI.errorMsg(newError);
            }
        }
    );

}

function removeScheduledNotification() {
    var notifications = Windows.UI.Notifications;
    var toastNotifier = notifications.ToastNotificationManager.createToastNotifier();
    var lvSelection = qr("#editor_listview").winControl;
    lvSelection.selection.getItems().done(
        function (selectedTasks) {
            var toastID = _editNum + "." + selectedTasks[0].index;
            var _allToasts = toastNotifier.getScheduledToastNotifications();
            _allToasts.forEach(
                function (_toast) {
                    if (_toast.id == toastID) {
                        toastNotifier.removeFromSchedule(_toast);
                    }
                }
            );
        }
    );
}

function reloadDay() {
    qr("#Schedule_DD").winControl.setDay();
}