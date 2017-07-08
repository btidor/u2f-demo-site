var pre = document.getElementById("p");
var appId = document.location.origin;
var u2f = window.u2f;

function println(str) {
    p.innerHTML += "\n  " + str;
}

function bind() {
    println("Binding...");
    println("* Downloading registration request");
    fetch("/enroll")
        .then(function(response) {
            return response.json();
        })
        .then(function(enrollment) {
            console.log(enrollment);
            var appId = enrollment["appId"];
            var registerRequests = enrollment["registerRequests"];
            var registeredKeys = enrollment["registeredKeys"];

            println("* Using app id: " + appId);
            println("* Waiting for Security Key registration");
            u2f.register(appId, registerRequests, registeredKeys, function(response) {
                console.log(response);
                if (response.errorCode) {
                    println("  Error " + response.errorCode + " (see http://bit.ly/2sQLK3Q)\n");
                    return;
                }

                println("* Uploading registration response");
                var fd = new FormData();
                fd.append("data", JSON.stringify(response));
                fetch("/bind", {method: "POST", body: fd})
                    .then(function(response) {
                        return response.text()
                    })
                    .then(function(msg) {
                        if (msg !== "true") {
                            console.error(msg);
                            println("  Failed: " + msg + "\n");
                            return;
                        }
                        println("* Success!\n");
                    })
                    .catch(function() {
                        println("  Error\n");
                    });
            });
        })
        .catch(function() {
            println("  Error\n");
        });
}

function verify() {
    println("Verifying...");
    println("* Downloading sign request");
    fetch("/sign")
        .then(function(response) {
            return response.json();
        })
        .then(function(sigreq) {
            console.log(sigreq);
            var appId = sigreq["appId"];
            var challenge = sigreq["challenge"];
            var registeredKeys = sigreq["registeredKeys"];

            println("* Waiting for Security Key signing");
            u2f.sign(appId, challenge, registeredKeys, function(response) {
                console.log(response);
                if (response.errorCode) {
                    println("  Error " + response.errorCode + " (see http://bit.ly/2sQLK3Q)\n");
                    return;
                }

                println("* Uploading sign response");
                var fd = new FormData();
                fd.append("data", JSON.stringify(response));
                fetch("/verify", {method: "POST", body: fd})
                    .then(function(response) {
                        return response.json();
                    })
                    .then(function(stats) {
                        println("  Touch: " + (stats["touch"] ? "yes" : "no") + "   Counter: " + stats["counter"]);
                        println("* Success!\n")
                    })
                    .catch(function() {
                        println("  Error\n");
                    });
            });
        })
        .catch(function() {
            println("  Error\n");
        });
}

window.addEventListener("load", function() {
    if (u2f === undefined) {
        println("ERROR: could not connect to window.u2f");
    } else if (u2f.isPolyfill) {
        // hacky patch to google's polyfill
        println("Connected to polyfilled window.u2f");
    } else {
        println("Connected to native window.u2f");
    }
    println("");
});
