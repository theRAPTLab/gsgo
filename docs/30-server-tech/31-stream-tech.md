# WebRTC and Video Streaming



The material available today is better than in the past. 

* [google codelab](https://codelabs.developers.google.com/codelabs/webrtc-web/#0)

We can't use internal webcams with WebRTC anymore due to the requirement that `getUserMedia()` will only work from localhost or https. For https to work, the domain has to be secured. However, an internal server with a variable IP address that isn't publicly on the Internet is not securable through a public CA certificate

* discussion on [stack exchange](https://security.stackexchange.com/questions/121163/how-do-i-run-proper-https-on-an-internal-network)
* firefox discussion on [migrating](https://blog.mozilla.org/webrtc/camera-microphone-require-https-in-firefox-68/)
* using iframes with [allow camera;microphone;autoplay](https://www.daily.co/blog/setting-up-a-local-webrtc-development-environment)

* Alternative to WebRTC [VideoJS](https://videojs.com/)
* NodeJS example [node-webrtc](https://github.com/node-webrtc/)
* access webcam from NodeJS
* [uvc controls](https://www.npmjs.com/package/uvc-control2) from NodeJS
* You can call a parent Javascript function from an iframe by accessing [window.parent](https://developer.mozilla.org/en-US/docs/Web/API/Window/parent)

