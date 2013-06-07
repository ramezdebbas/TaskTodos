
var secondaryTileActivation = false;
var tileNumber = 0;
var viewStates = Windows.UI.ViewManagement.ApplicationViewState;
var _trial_App;
var local_FileSystem;

(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;

    app.onsettings = function (e) {
        e.detail.applicationcommands = {
            'settingsFlyout_About': { title: "About", href: '/settings.html' },
            'settingsFlyout_Options': { title: "Options", href: '/settings.html' },
            'settingsFlyout_Feedback': { title: "Feedback", href: '/settings.html' }
        };
        WinJS.UI.SettingsFlyout.populateSettings(e);
    }

    app.addEventListener("activated", function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // App Intialized

                local_FileSystem = WinJS.Application.local;

                local_FileSystem.exists("notes.xml").done(
                    function (fileExists) {
                        if (!fileExists) {
                            localStorage.alreadyUsed = 0;
                        }

                        if (!localStorage.alreadyUsed || localStorage.alreadyUsed == 0) {

                            writeDefaultText();

                        }

                        args.setPromise(WinJS.UI.processAll().then(function () {
                            if (nav.location) {
                                nav.history.current.initialPlaceholder = true;
                                return nav.navigate(nav.location, nav.state);
                            } else {
                                return nav.navigate(Application.navigator.home);
                            }
                        }));

                    }
                    );


            } else {
                // Restored from suspension

            }

            if (args.detail.arguments) {
                if (args.detail.arguments.indexOf("tileID=" >= 0)) {
                    secondaryTileActivation = true;
                    tileNumber = args.detail.arguments.substr(args.detail.arguments.indexOf("=") + 1, args.detail.arguments.length);
                }
            }

            _trial_App = App.PurchaseStatus.trial();

            //Windows.ApplicationModel.Store.CurrentAppSimulator.requestAppPurchaseAsync(false).done(
            //    function () {
            //        if (Windows.ApplicationModel.Store.CurrentAppSimulator.licenseInformation.isTrial) {
            //            _trial_App = true;
            //        } else {
            //            _trial_App = false;
            //        }
            //    }
            //);

            var appTheme = App.UI.theme;
            appTheme.background = localStorage.background;
            appTheme.backimage = localStorage.backimage;
            appTheme.titleColor = localStorage.titleColor;
            appTheme.listBack = localStorage.listBack;
            appTheme.listColor = localStorage.listColor;

            App.UI.theme.bind("change", function () {
                var appTheme = App.UI.theme;
                localStorage.background = appTheme.background;
                localStorage.backimage = appTheme.backimage;
                localStorage.titleColor = appTheme.titleColor;
                localStorage.listBack = appTheme.listBack;
                localStorage.listColor = appTheme.listColor;
                applyTheme(true);
            });

            App.FileSystem.data.bind("change", tileUpdate);

            if (app.sessionState.history) {
                nav.history = app.sessionState.history;
            }
            
        }
    });

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. If you need to 
        // complete an asynchronous operation before your application is 
        // suspended, call args.setPromise().
        app.sessionState.history = nav.history;
    };

    app.start();
})();




function applyTheme(changeBody) {
    if (changeBody) {
        document.body.style.backgroundColor = localStorage.background;
        document.body.style.backgroundImage = localStorage.backimage;
        document.body.style.backgroundSize = "cover";
    }
    var _allTextColorElements = document.getElementsByClassName("dynamicTextColor");
    for (var i = 0; i < _allTextColorElements.length; i++) {
        _allTextColorElements[i].style.color = localStorage.titleColor;
    }
    var _dynamicColorButtons = document.getElementsByClassName("dynamicColorButton");
    for (var j = 0; j < _dynamicColorButtons.length; j++) {
        _dynamicColorButtons[j].style.color = localStorage.titleColor;
        _dynamicColorButtons[j].style.borderColor = localStorage.titleColor;
    }
    var _dynamicColorTextBox = document.getElementsByClassName("dynamicColorTextBox");
    for (var k = 0; k < _dynamicColorTextBox.length; k++) {
        _dynamicColorTextBox[k].style.color = localStorage.background;
        _dynamicColorTextBox[k].style.backgroundColor = localStorage.titleColor;
    }
    var _dynamicColorProgressBars = document.getElementsByClassName("dynamicColorProgressBar");
    for (var l = 0; l < _dynamicColorProgressBars.length; l++) {
        _dynamicColorProgressBars[l].style.color = "green";
        _dynamicColorProgressBars[l].style.backgroundColor = "none";
    }
    var _dynamicColorListBoxes = document.getElementsByClassName("dynamicColorListBox");
    for (var m = 0; m < _dynamicColorListBoxes.length; m++) {
        _dynamicColorListBoxes[m].style.color = localStorage.listColor;
        _dynamicColorListBoxes[m].style.backgroundColor = localStorage.listBack;
    }
}

function showAppSettings() {
    WinJS.UI.SettingsFlyout.show();
}

function resetApp() {
    App.UI.confirm("You\'re about to delete your all the application saved data!", "Really?").done(
        function (command) {
            if (command.label == "OK") {
                localStorage.clear();
                setTimeout(function () {
                    writeDefaultText();
                    Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForApplication().clear();
                    var _toastNotifier = Windows.UI.Notifications.ToastNotificationManager.createToastNotifier();
                    var _allToasts = _toastNotifier.getScheduledToastNotifications();
                    _allToasts.forEach(
                        function (_toast) {
                            _toastNotifier.removeFromSchedule(_toast);
                        }
                    );
                    window.close();
                }, 500);
            }
        }
    );
}

function tileUpdate() {

    var info = App.FileSystem.data._to_dos;
    if (info.length > 0) {

        var tileTemplate = "<tile><visual>"
        + "<binding template='TileWidePeekImage01' branding='none'>"
        + "<text id='1'></text><text id='2'></text>"
        + "<image id='1' src='' /></binding>"
        + "<binding template='TileSquareText01' branding='logo'>"
        + "<text id='1'></text></binding>"
        + "</visual></tile>";

        var tileXml = new Windows.Data.Xml.Dom.XmlDocument();
        tileXml.loadXml(tileTemplate);

        var tileXmlWide = tileXml.getElementsByTagName("binding")[0];
        var stTileXml = tileXml.getElementsByTagName("binding")[1];

        var max = Math.min(4, info.length);
        tileXmlWide.getElementsByTagName("text")[0].appendChild(tileXml.createTextNode("Lists: " + info.length));
        stTileXml.getElementsByTagName("text")[0].appendChild(tileXml.createTextNode("Lists: " + info.length));
        var tileContent = "";
        for (var i = 0; i < max; i++) {
            tileContent += info.getAt(i).title + "\n";
        }

        tileXmlWide.getElementsByTagName("text")[1].appendChild(tileXml.createTextNode(tileContent));

        tileXmlWide.getElementsByTagName("image")[0].setAttribute("src", "/images/widelogo.png");


        var tileNotification = new Windows.UI.Notifications.TileNotification(tileXml);

        Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForApplication().update(tileNotification);


    } else {
        Windows.UI.Notifications.TileUpdateManager.createTileUpdaterForApplication().clear();
    }

}

function alert(x) {
    Windows.UI.Popups.MessageDialog(x).showAsync();
}

function qr(str) {
    return document.querySelector(str);
}

function writeDefaultText() {

    var localText = "<root><todos><item><id>1</id><title>Important</title><task done='no'>Rate this app!</task><task done='no'>Review this app</task></item><item><id>2</id><title>Tasks</title><task done='yes'>Download this app</task><task done='no'>Share this app!</task></item></todos></root>";

    local_FileSystem.writeText("notes.xml", localText).done(
        function () {

            localStorage.background = "white";
            localStorage.backimage = "url('/images/background-default.jpg')";
            localStorage.titleColor = "darkred";
            localStorage.listBack = "royalblue";
            localStorage.listColor = "white";

            localStorage.alreadyUsed = 1;

            var appTheme = App.UI.theme;
            appTheme.background = localStorage.background;
            appTheme.backimage = localStorage.backimage;
            appTheme.titleColor = localStorage.titleColor;
            appTheme.listBack = localStorage.listBack;
            appTheme.listColor = localStorage.listColor;
            appTheme.change++;

        });
}