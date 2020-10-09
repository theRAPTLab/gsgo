## POSE JSON FORMAT (VERSION 2?)

```json
{
  "header": {
    "seq": 19,
    "stamp": {
      "sec": 1499551098,
      "nsec": 639985117
    },
    "frame_id": "/world"
  },
  "persons": [
    {
      "id": 1,
      "height": 0,
      "orientation": -0.926461,
      "age": 1.49877,
      "predicted_pose_name": "unknown",
      "predicted_pose_id": -1,
      "prediction_score": -1,
      "poses": [
        {
          "pose_name": "arms_mid",
          "pose_id": 0,
          "prediction_score": 2.13884
        },
        {
          "pose_name": "right_arm_up",
          "pose_id": 1,
          "prediction_score": 3.94927
        }
      ],
      "joints": {
        "HEAD": {
          "x": -0.0906074,
          "y": -1.95927,
          "z": 1.39235,
          "confidence": 1
        },
        "NECK": {
          "x": -0.305885,
          "y": -1.99733,
          "z": 1.2753,
          "confidence": 1
        },
        "RIGHT_SHOULDER": {
          "x": -0.182719,
          "y": -2.08293,
          "z": 1.25705,
          "confidence": 1
        },
        "RIGHT_ELBOW": {
          "x": -0.113694,
          "y": -2.14314,
          "z": 0.976763,
          "confidence": 1
        },
        "RIGHT_WRIST": {
          "x": -0.00581919,
          "y": -2.06459,
          "z": 0.75007,
          "confidence": 1
        },
        "LEFT_SHOULDER": {
          "x": -0.43296,
          "y": -1.88762,
          "z": 1.26376,
          "confidence": 1
        },
        "LEFT_ELBOW": {
          "x": -0.54389,
          "y": -1.90779,
          "z": 0.976199,
          "confidence": 1
        },
        "LEFT_WRIST": {
          "x": -0.563204,
          "y": -1.90511,
          "z": 0.717013,
          "confidence": 1
        },
        "RIGHT_HIP": {
          "x": -0.247023,
          "y": -2.08887,
          "z": 0.744438,
          "confidence": 1
        },
        "RIGHT_KNEE": {
          "x": -0.241867,
          "y": -2.06885,
          "z": 0.346791,
          "confidence": 1
        },
        "RIGHT_ANKLE": {
          "x": -0.261826,
          "y": -2.13316,
          "z": 0.254384,
          "confidence": 1
        },
        "LEFT_HIP": {
          "x": -0.40896,
          "y": -2.00384,
          "z": 0.729637,
          "confidence": 1
        },
        "LEFT_KNEE": {
          "x": -0.345732,
          "y": -1.90366,
          "z": 0.260481,
          "confidence": 1
        },
        "LEFT_ANKLE": {
          "x": -0.305734,
          "y": -1.86109,
          "z": -0.0134433,
          "confidence": 1
        },
        "CHEST": {
          "x": -0.331628,
          "y": -2.05294,
          "z": 0.911637,
          "confidence": 1
        }
      }
    }
  ]
}
```
