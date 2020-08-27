## POSE JSON FORMAT

```json
{
  "header":{
      "seq":71251,
      "stamp":{
         "sec":1415305737,
         "nsec":110138944
      },
      "frame_id":"world"
   },
  "persons": [
      {
         "id": 3,
         "pose_predicted":"ARMS_TOGETHER_LEFT",
         "prediction_confidence":0.5,
         "height":1.50029,
         "age":29.471
         "poses": // they can be ordered by confidence
         [
            {
               "prediction": "ARM_TOGETHER_LEFT", // user defined name of the pose
               "class_id": 2, // index of the pose in the gallery
               "confidence": 0.988 // prediction confidence
            },
            {
               "prediction": "ARMS_UP", // user defined name of the pose
               "class_id": 1, // index of the pose in the gallery
               "confidence": 0.7 // prediction confidence
            },
            // other poses
         ],
         "joints": {
        "model":"rtpose_MPI",
            "HEAD":{
               "x":0.112,
               "y":0.112,
               "z":0.112,
               "confidence":0.8971
            },
            "NECK":{

            },
            "RSHOULDER":{

            },
            "RELBOW":{

            },
            "RWRIST":{

            },
            "LSHOULDER":{

            },
            "LELBOW":{

            },
            "LWRIST":{

            },
            "RHIP":{

            },
            "RKNEE":{

            },
            "RANKLE":{

            },
            "LHIP":{

            },
            "LKNEE":{

            },
            "LANKLE":{

            },
            "CHEST":{

            }
         }
      }, // end person
      // other persons in the scene
   ]
} // JSON
```
