Let's assume that all the servers can potentially run on one machine or multiple ones.

FIRST PASS DESIGN (just for scaffolding out some servers)

## GEMSTEP Main Server (app_srv)

* main login for all users on http port 80
* ursys controller running on socket port 2929
* faketrack listener on socket port 2525
* ptrack listener on socket 3030
* ptrack UDP multicast group 224.0.0.1, port 21234
* centralized data storage via URSYS
* centralized media storage via URSYS
* message dispatching via URSYS
* resource directory services via URSYS

The GEMSTEP server has a known address using mDNS. Its hostname is `https://gemstep.local` when deployed locally on modern networked machines. Windows 10 doesn't always cleanly support mDNS from what I'm reading, though recent versions are supposed to have it built-in. There are enough weird Windows things to make it probably that it won't work very well.

## Admin Server (admin_srv)
This is a separate webserver that can be used to access URSYS resources specific to GEMSTEP operations.
* accessible from port 8800

## Simulation Server (sim_srv)
This is a server that handles the underlying simulation, but doesn't necessarily display anything. SimServers generate data for clients to render. The client may be local, or remote. 

## GEM Client Server (gem_srv)
This is a server that knows how to render SimServer data and accept inputs. A DisplayServer can be used to drive 
* display runs on port 8080

This is a WIP

