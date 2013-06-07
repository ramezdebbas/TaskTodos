var charLimit = App.PurchaseStatus.charLimit();

var tileInterval;


(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/home/home.html", {

        ready: function (element, options) {

            if (options && options.noback) {
                document.querySelector("button[aria-label=Back]").style.display = "none";
            }


            var _localFS = WinJS.Application.local;
            _localFS.readText("notes.xml").done(
                function (ex) {

                    document.getElementById("progress-bar").innerHTML = "<progress></progress>";

                    var XMLParser = new DOMParser();
                    var res = XMLParser.parseFromString(ex, "text/xml");

                    try {
                        if (!res.getElementsByTagName('todos')) {
                            var newError = new WinJS.ErrorFromName("File Error", "Please reset the app from the settings charm!");
                            throw newError;
                        }

                        var item = res.getElementsByTagName("todos")[0].getElementsByTagName("item");

                        var _to_dos = [];

                        for (var i = 0; i < item.length; i++) {

                            var tempContent = "<ul>";

                            for (var j = 0; j < 4; j++) {
                                if (item[i].getElementsByTagName("task")[j]) {
                                    var totalText = item[i].getElementsByTagName("task")[j].childNodes[0].nodeValue;
                                    var tempText = "";
                                    (totalText.length > 20) ? tempText = totalText.substr(0, 20) + "..." : tempText = totalText;
                                    tempContent += "<li>" + App.UI.convertToString(tempText) + "</li>";
                                }
                                else {
                                    break;
                                }
                            }

                            tempContent += "</ul>";
                            var totalTitle = item[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;
                            var tempTitle = "";
                            (totalTitle.length > 15) ? tempTitle = totalTitle.substr(0, 15) + "..." : tempTitle = totalTitle;

                            _to_dos[i] = {
                                title: App.UI.convertToString(tempTitle),
                                content: tempContent,
                                _id: "number" + item[i].getElementsByTagName("id")[0].childNodes[0].nodeValue,
                                listCount: item[i].getElementsByTagName("id")[0].childNodes[0].nodeValue

                            };

                        }

                        var _to_dos = _to_dos.reverse();
                        App.FileSystem.data._to_dos = new WinJS.Binding.List(_to_dos);
                        App.FileSystem.data.change++;

                        if (secondaryTileActivation) {
                            secondaryTileActivation = false;
                            editNote(tileNumber, true);
                        }

                        var todo_listControl;
                        var todo_list = App.FileSystem.data._to_dos;
                        todo_listControl = document.querySelector("#_notes_list").winControl;
                        todo_listControl.itemDataSource = todo_list.dataSource;
                        todo_listControl.itemTemplate = document.querySelector("._notes_template");

                        if (item.length == 0) {
                            var newError = new WinJS.ErrorFromName("No List", "No List to be shown! Add a new by right clicking or swiping up the app bar");
                            throw newError;
                        }

                        document.getElementById("progress-bar").innerHTML = "";



                    } catch (error) {
                        App.UI.errorMsg(error);
                        document.getElementById("progress-bar").innerHTML = "";
                    }


                });

            var windowAppBar = document.getElementById("windowAppBar").winControl;
            var _notes_listControl = document.getElementById("_notes_list").winControl;

            windowAppBar.sticky = true;

            var addListCommand = windowAppBar.getCommandById("addListCommand");
            addListCommand.onclick = function (event) {

                var addListFlyout = document.getElementById("addListFlyout");
                var addListFlyoutControl = addListFlyout.winControl;
                addListFlyoutControl.show(this);

            };

            var removeListCommand = windowAppBar.getCommandById("removeListCommand");
            removeListCommand.onclick = function (e) {
                App.UI.confirm("You asked me to remove selected lists and I\'ve no problemm in doing that", "Hi!").done(
                    function (command) {
                        if (command.label == "OK")
                            removeList();
                    }
                );
            };



            windowAppBar.hideCommands([removeListCommand]);

            var addListButton = document.getElementById("addListButton").onclick = function (event) {
                addNewList();
            };

            var viewState = Windows.UI.ViewManagement.ApplicationView.value;
            if (viewState == viewStates.snapped) {
                _notes_listControl.layout = new WinJS.UI.ListLayout();
            } else {
                _notes_listControl.layout = new WinJS.UI.GridLayout();
            }

            _notes_listControl.onselectionchanged = function () {
                _notes_listControl.selection.getItems().done(
                    function (selectedLists) {
                        if (selectedLists.length == 0) {
                            try {
                                windowAppBar.hideCommands([removeListCommand]);
                            } catch (e) {
                                null;
                            }
                        } else {
                            if (selectedLists.length == 1) {
                                windowAppBar.showCommands([removeListCommand]);
                                windowAppBar.show();
                            } else {
                                try {
                                    windowAppBar.showCommands([removeListCommand]);
                                    windowAppBar.show();
                                } catch (e) {
                                    null;
                                }
                            }
                        }

                    }
                    );
            };


            applyTheme();
            //getNotes();

        },

        unload: function () {
            document.getElementById("_notes_list").winControl.selection.clear();
            document.getElementById("_notes_list").winControl.onselectionchanged = null;
            document.getElementById("windowAppBar").parentElement.removeChild(document.getElementById("windowAppBar"));
        },

        updateLayout: function (element, viewState, lastViewState) {
            if (viewState == viewStates.snapped) {
                document.querySelector("#_notes_list").winControl.layout = new WinJS.UI.ListLayout();
            } else {
                document.querySelector("#_notes_list").winControl.layout = new WinJS.UI.GridLayout();
            }
        }

    });

})();


function editNote(theList, queryBack) {
    var headers = (queryBack) ? { second: true } : "";
    App.UI.current = theList;
    WinJS.Navigation.navigate("/pages/todo_editor/todo_editor.html", headers);
}

function addNewList() {
    "use strict";

    App.FileSystem.readDataFile().done(
        function (ex) {

            try {

                var res = (new DOMParser()).parseFromString(ex, "text/xml");

                var _allItems = res.getElementsByTagName("todos")[0].getElementsByTagName("item");

                var _allExistingIDs = [];

                for (var counter = 0; counter < _allItems.length; counter++) {

                    _allExistingIDs.push(_allItems[counter].getElementsByTagName("id")[0].childNodes[0].nodeValue);

                }

                _allExistingIDs.sort();

                var IDtoAdd = _allExistingIDs.length + 1;

                for (var IDChecker = 0; IDChecker < _allExistingIDs.length; IDChecker++) {
                    if ((parseInt(IDChecker) + 1) !== parseInt(_allExistingIDs[IDChecker])) {
                        IDtoAdd = IDChecker + 1;
                        break;
                    }
                }

                var newItem = res.createElement("item");

                var newID = res.createElement("id");
                newID.appendChild(res.createTextNode(IDtoAdd));



                var newTitleValue = document.getElementById("addListInput").value;

                if (_trial_App && newTitleValue.length > charLimit) {
                    var newError = new WinJS.ErrorFromName("", "You are permitted to have list titles shorter than " + charLimit + " letters");
                    throw newError;
                }

                if (!newTitleValue.charAt(0)) {
                    var newError = new WinJS.ErrorFromName("Title", "Title is required");
                    throw newError;
                } else {


                    var newTitle = res.createElement("title");
                    newTitle.appendChild(res.createTextNode(newTitleValue));

                    newItem.appendChild(newID);
                    newItem.appendChild(newTitle);

                    res.getElementsByTagName("todos")[0].appendChild(newItem);

                    var newXMLString = (new XMLSerializer()).serializeToString(res);


                    WinJS.Application.local.writeText("notes.xml", newXMLString).done(
                        function () {
                            document.getElementById("windowAppBar").winControl.hide();
                            document.getElementById("addListInput").value = "";
                            App.FileSystem.data._to_dos.push({
                                title: (newTitleValue.length > 20) ? newTitleValue.substr(0, 20) + "..." : newTitleValue,
                                content: "<ul></ul>",
                                _id: "number" + IDtoAdd,
                                listCount: IDtoAdd
                            });
                            App.FileSystem.data.change++;
                        },
                        function (error) {
                            throw error;
                        },
                        function () {
                        }
                        );
                }





            }
            catch (error) {
                App.UI.errorMsg(error);
            }



        });
}


function removeList() {

    App.FileSystem.readDataFile().done(
        function (ex) {

            var listViewController = document.getElementById("_notes_list").winControl;

            listViewController.selection.getItems().done(
                function (selectedLists) {

                    var res = (new DOMParser()).parseFromString(ex, "text/xml");
                    var _all_to_dos = res.getElementsByTagName("todos")[0];
                    var _allItemsArray = _all_to_dos.getElementsByTagName("item");

                    for (var i = 0; i < selectedLists.length; i++) {

                        for (var counter = 0; counter < _allItemsArray.length; counter++) {

                            var itemID = _allItemsArray[counter].getElementsByTagName("id")[0].childNodes[0].nodeValue;

                            if (itemID == selectedLists[i].data.listCount) {
                                var tempID = counter;
                                break;
                            }

                        }

                        _all_to_dos.removeChild(_allItemsArray[tempID]);
                        App.FileSystem.data._to_dos.splice(App.FileSystem.data._to_dos.indexOf(selectedLists[i].data), 1);
                        App.FileSystem.data.change++;

                    }

                    WinJS.Application.local.writeText("notes.xml", (new XMLSerializer()).serializeToString(res)).done(
                        function () {
                            document.getElementById("windowAppBar").winControl.hideCommands([removeListCommand]);
                        });

                });

        });


}
