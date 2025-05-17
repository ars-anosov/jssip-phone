function jssip_phone_code() {

  JsSIP.debug.disable('JsSIP:*');
  
  var socket = new JsSIP.WebSocketInterface('wss://sbc.pecom.ru:9443/');
  var configuration = {
    sockets: [socket],
    uri: 'sip:'+document.getElementById("callerInp").value+'@sbc.pecom.ru',
    password: document.getElementById("callerPwdInp").value,
    realm: 'sbc.pecom.ru',
    register: true
  };

  var ua;
  var rtc_session;

  var audioRingtone = new Audio();
  audioRingtone.preload = 'auto';
  audioRingtone.src = 'mp3/ringtone01.mp3';

  var audioRingbackOut = new Audio();
  audioRingbackOut.preload = 'auto';
  audioRingbackOut.src = 'mp3/ringback_outgoing.mp3';
  audioRingbackOut.loop = true



  // $(document).on('click', '#connectBtn', connectWs)
  document.getElementById("connectBtn").addEventListener("click", function (e) {
    connectWs();
  });

  // $(document).on('click', '#uacInfo', uaDisconnect)
  document.getElementById("uacInfo").addEventListener("click", function (e) {
    uaDisconnect();
  });

  // $(document).on('click', '#answerBtn', callIncomeAnswer)
  document.getElementById("answerBtn").addEventListener("click", function (e) {
    callIncomeAnswer();
  });

  // $(document).on('click', '#endCallIncomeBtn', callIncomeEnd)
  document.getElementById("endCallIncomeBtn").addEventListener("click", function (e) {
    callIncomeEnd();
  });

  // $(document).on('click', '#callBtn', callOutgoStart)
  document.getElementById("callBtn").addEventListener("click", function (e) {
    callOutgoStart();
  });

  // $(document).on('click', '#endCallOutgoBtn', callOutgoEnd)
  document.getElementById("endCallOutgoBtn").addEventListener("click", function (e) {
    callOutgoEnd();
  });



  function connectWs() {
    document.getElementById("callerInp").hidden = true;
    document.getElementById("callerPwdInp").hidden = true;
    document.getElementById("connectBtn").hidden = true;
  
    document.getElementById("uacInfo").hidden = false;
    document.getElementById("numInp").hidden = false;
    document.getElementById("callBtn").hidden = false;
  
    configuration.uri = 'sip:'+document.getElementById("callerInp").value+'@sbc.pecom.ru';
    configuration.password = document.getElementById("callerPwdInp").value;
    document.getElementById("uacInfo").innerHTML = configuration.uri;
  
    ua = new JsSIP.UA(configuration);
    ua.on('connected', function (e) {
      console.log('ua connected');
      document.getElementById("uacInfo").style.backgroundColor = "lightgreen";
    });
    ua.on('disconnected', function (e) {
      console.log('ua disconnected');
      document.getElementById("uacInfo").style.backgroundColor = "red";
      document.getElementById("callBtn").style.backgroundColor = "lightgray";
      document.getElementById("callBtn").innerHTML = "disconnected";
    });
    ua.on('registered', function (e) {
      console.log('ua registered');
      document.getElementById("uacInfo").style.backgroundColor = "lightgreen";
      document.getElementById("callBtn").style.backgroundColor = "lightgreen";
      document.getElementById("callBtn").innerHTML = "Позвонить";
    });
    ua.on('unregistered', function (e) {
      console.log('ua unregistered');
      document.getElementById("uacInfo").style.backgroundColor = "lightgray";
      document.getElementById("callBtn").style.backgroundColor = "lightgray";
      document.getElementById("callBtn").innerHTML = "unregistered";
    });
    ua.on('registrationFailed', function (e) {
      console.log('ua registrationFailed');
      document.getElementById("uacInfo").style.backgroundColor = "red";
      document.getElementById("callBtn").style.backgroundColor = "lightgray";
      document.getElementById("callBtn").innerHTML = "registrationFailed";
    });



    ua.on('newRTCSession', function (e) {
      console.log('ua newRTCSession');

      // set GLOBAL var
      rtc_session = e.session;

      console.log("newRTCSession > originator:", e.originator)
      if (e.originator == "remote") {
        document.getElementById("callBtn").hidden = true;
        document.getElementById("answerBtn").hidden = false;
        document.getElementById("endCallIncomeBtn").hidden = false;

        rtc_session.on('ended', (event) => {
          console.log('rtc_session ended', event);
          callIncomeEnd();
        });

        rtc_session.on('failed', (event) => {
          console.log('rtc_session failed', event);
          callIncomeEnd();
        });

        audioRingtone.play();
      }
    });

    ua.start();
  }



  function uaDisconnect() {
    ua.stop();

    document.getElementById("callerInp").hidden = false;
    document.getElementById("callerPwdInp").hidden = false;
    document.getElementById("connectBtn").hidden = false;

    document.getElementById("uacInfo").hidden = true;
    document.getElementById("numInp").hidden = true;
    document.getElementById("callBtn").hidden = true;
  }



  function callIncomeAnswer() {
    var options = {
      'mediaConstraints': { 'audio': true, 'video': false }
    };

    audioRingtone.pause();
    var xxx = rtc_session.answer(options);

    // .connection появится только после .answer()
    rtc_session.connection.addEventListener('addstream', (event) => {
      console.log('rtc_session addstream');
      document.getElementById("remoteAudio").srcObject = event.stream;
      document.getElementById("remoteAudio").play();
    });

    document.getElementById("answerBtn").hidden = true;
    document.getElementById("endCallIncomeBtn").hidden = false;
  }



  function callIncomeEnd() {
    audioRingtone.pause();
    if (rtc_session.isInProgress() || rtc_session.isEstablished()) { rtc_session.terminate(); }
    document.getElementById("callBtn").hidden = false;
    document.getElementById("endCallIncomeBtn").hidden = true;
    document.getElementById("answerBtn").hidden = true;
  }



  function callOutgoStart() {
    var eventHandlers = {
      'progress': function (e) {
        document.getElementById("callBtn").hidden = true;
        console.log('call progress');
      },
      'failed': function (e) {
        console.log('call failed > cause: ', e.cause);
        audioRingbackOut.pause();
        document.getElementById("callBtn").hidden = false;
        document.getElementById("endCallOutgoBtn").hidden = true;
        document.getElementById("endCallIncomeBtn").hidden = true;
      },
      'ended': function (e) {
        console.log('call ended > cause: ', e.cause);
        audioRingbackOut.pause();
        document.getElementById("callBtn").hidden = false;
        document.getElementById("endCallOutgoBtn").hidden = true;
        document.getElementById("endCallIncomeBtn").hidden = true;
      },
      'confirmed': function (e) {
        audioRingbackOut.pause();
        console.log('call confirmed');
        document.getElementById("callBtn").hidden = true;
      },
      // 'sdp': function (e) {
      //   console.log('call sdp');
      //   console.log(e);
      // },
      // 'icecandidate': function (e) {
      //   console.log('call icecandidate');
      //   console.log(e);
      //   e.ready();
      // }
    };
    var options = {
      'eventHandlers': eventHandlers,
      'mediaConstraints': { 'audio': true, 'video': false },
      // 'pcConfig': {
      //   'iceServers': [
      //       {'urls': ['stun:stun.l.google.com:19302']}
      //   ]
      // }
    };

    var numInp = document.getElementById("numInp").value;
    ua.call('sip:' + numInp + '@sbc.pecom.ru', options);
    audioRingbackOut.play();
    rtc_session.connection.addEventListener('addstream', (event) => {
      console.log('rtc_session addstream');
      document.getElementById("remoteAudio").srcObject = event.stream;
      document.getElementById("remoteAudio").play();
    });

    document.getElementById("endCallOutgoBtn").hidden = false;
  }

  document.getElementById("numInp").addEventListener("keypress", function(event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
      event.preventDefault();
      callOutgoStart();
    }
  });

  document.getElementById("callerPwdInp").addEventListener("keypress", function(event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
      event.preventDefault();
      connectWs();
    }
  });



  function callOutgoEnd() {
    audioRingbackOut.pause();
    ua.terminateSessions();
    document.getElementById("callBtn").hidden = false;
  }

}