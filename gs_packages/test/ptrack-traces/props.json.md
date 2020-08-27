## PROPS JSON FORMAT
``` json
{
   "header":{
      "seq":71251,
      "stamp":{
         "sec":1415305737,
         "nsec":110138944
      },
      "frame_id":"world"
   },
   "objects":[
      {
         "id":387,            // unique across all object detections
                              // preferably unique across tracks, too
                              // so we can unify later
         "class_id": 202,     // system-defined class id, during training process
                              // should persist across training save/restore
         "class": "red ball", // user-provided class description, also persistent
         "instance_id": 3,    // unique detection id (could be same as id, but
                              // would prefer sequential for the class)
         "x":-0.89131,
         "y":2.41851,
         "height":1.55837,
         "age":29.471,
         "confidence":.0500193
      },
      
      // ... optionally more objects but must handle UDP segmentation so probably not ... 
      
   ]
}
```
