# How Tracking Works

The last version to use PTrack/FakeTrack was ISTEP in 2017. We have made significant updates since then.

## Basic Theory

* Create a UDP LAN multicast listener on **port 21234**
* Forward UDP packets to TCP web socket subscribers on **port 3030**

Multicast is one computer sending a UDP package to a special IP address, in the range 224.0.0.1 through 239.255.255.255. These "groups" are
assigned by IANA.

The magic of multicast is that the network hardware **propagates packets across routers** and anyone can listen. To listen:

1. create socket for udp4
2. enable multicast reception
3. set multicast TTL (not necessary I suspect for a client)
4. join a channel/group (224.0.0.1). Add originating host if necessary
5. bind 'message' event to handler to receive packets

From what I understand:

The UDP source has a host_address and a port. Together this identifies the source, which then puts all its traffic on a multicast_group_address. A listener would bind to the port, and instead of selecting host_address it would bind to the multicast_group_address (done by adding membership).

If the multicast_address is a regular one, then one must also designate the host_address to receive packets from it even if a member of the multicast_group_address.

## References 

* [NodeJS Multicast](https://stackoverflow.com/questions/14130560/nodejs-udp-multicast-how-to)
* [Multicast Addresses](https://iana.org/assignments/multicast-addresses/multicast-addresses.xhtml)

# Tracking Settings

From `settings.yaml`:

``` yaml
step:
  locationsVersion: 0
  locations:
  - location_id: "faketrack"
    name: "FakeTrack Utility"
    sx: 1
    sy: 1
    sz: 1
    rx: 0
    ry: 0
    rz: 0
    tx: 0
    ty: 0
    tz: 0
    width: 5
    depth: 5
    webrtc_ip: "localhost"
    webrtc_port: 3002
    ptrackSRadius: 0.1
    ptrackTimeout: 66
    ptrackMinAge: 16
    webcam_force: false
    webcam:
      off_x: 0
      off_y: 0
      width: 320
      height: 240
      r_color: 0xffffff
      r_alpha: 1
      opacity: 1
      bg_opacity: 0.5
      bg_blending: 1
```

# Input Processing

```js
BEES.SetHandler('GetInput', function( int_ms ) {
  if (!m_doProcessTracks) return;

  // Update Student Controlled Bees
  // UpdateTrackerPieces() accepts a piece init function
  // which adds pieces to the REFEREE's PLAYERBEES group
  INPUT.UpdateTrackerPieces ( int_ms, {
    resetFunc : m_ResetBeePiece,
    addedFunc : function(p){
      p.Show();
      // force hide meter until we actually set it otherwise unused bees' meters are
      // left in the middle of the screen
      p.HideMeter();
    },
    lostFunc  : function(p){p.Hide();}
  });
  INPUT.UI_ShowPieceInformation(UIBIND.ViewModel());
  m_pieces = INPUT.GetValidTrackerPieces();
  /* do something with pieces */
//			BEES.ShowPoseDirection( m_pieces );
});
/*/ SYSLOOP Called AFTER 'GetInput'
/*/ BEES.SetHandler('Update', function( int_ms ) {
  // Hide all the lines every frame otherwise
  // dropped entities will leave their lines
  // lying around
  m_HideAllLines();
  if (m_doProcessTracks) {
    BEES.ProcessTracks( int_ms );				
  }
  m_UpdateAIBees( int_ms );
});
```

PTRACK CONNECTION AND MAPPING
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  InitializeConnection (token, serverAddress )
  -
  InitializeTrackerPiecePool ({ count: cstrFunc: initFunc })
  UpdateTrackerPieces ( ms, createFunc )
  GetValidTrackerPieces ()

  LOCATION USER INTERFACE BINDING
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  BindLocationUI ( viewmodel )


  SET LOCATION (PTRACK) AND GAME WORLD TRANSFORMS
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  SetLocationTransform ( locationObj )
  SetWorldTransform ( dimObj )

  NOISE REJECTION PARAMETERS & RAW DATA ACCESS
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  UpdateFilterSettings ()
  SetFilterTimeout ( nop )
  SetFilterAgeThreshold ( age )
  SetFilterFreshnessThreshold ( threshold )
  SetFilterRadius ( rad )
  -
  MapEntities ( pieceDict, intervalMS )
  PTrackEntityDict ()

  INPUT SAVING AND PLAYBACK
  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  SelectReplayFile ( filename )
  ReplayTrackerData ( filename )
