import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelTracker extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Setup',
      xmin: Infinity,
      xmax: -Infinity,
      ymin: Infinity,
      ymax: -Infinity,
      entities: [],
      tentities: [],
      transform: {
        scaleX: 1,
        scaleY: 1,
        translateX: 0,
        translateY: 0,
        rotate: 0,
        useAccelerometer: true
      }
    };

    this.onFormInputUpdate = this.onFormInputUpdate.bind(this);
    this.init = this.init.bind(this);
    this.updateTransform = this.updateTransform.bind(this);
    this.update = this.update.bind(this);

    UR.HandleMessage('INIT_TRACKER', this.init);
    UR.HandleMessage('NET:POZYX_TRANSFORM_UPDATE', this.updateTransform);
    UR.HandleMessage('NET:ENTITY_UPDATE', this.update);
  }

  componentDidMount() {}

  componentWillUnmount() {
    UR.UnhandleMessage('INIT_TRACKER', this.init);
    UR.UnhandleMessage('NET:POZYX_TRANSFORM_UPDATE', this.updateTransform);
    UR.UnhandleMessage('NET:ENTITY_UPDATE', this.update);
  }

  onFormInputUpdate(e) {
    console.log('typed', e.target.value, e.target.id);
    const data = {};
    if (e.target.type === 'checkbox') {
      data[e.target.id] = e.target.checked;
    } else {
      data[e.target.id] = e.target.value;
    }
    UR.RaiseMessage('NET:POZYX_TRANSFORM_SET', data);
  }

  init() {
    UR.CallMessage('NET:POZYX_TRANSFORM_REQ').then(rdata =>
      this.updateTransform(rdata)
    );
  }

  updateTransform(data) {
    this.setState({ transform: data.transform });
  }

  update(data) {
    const { entities, tentities } = data;
    // console.log(entities);
    // Calculate Limits
    const x = entities.map(e => e.x);
    const y = entities.map(e => e.y);
    this.setState(state => {
      return {
        xmin: Math.min(state.xmin, ...x),
        xmax: Math.max(state.xmax, ...x),
        ymin: Math.min(state.ymin, ...y),
        ymax: Math.max(state.ymax, ...y),
        entities,
        tentities
      };
    });
  }

  render() {
    const {
      title,
      xmin,
      xmax,
      ymin,
      ymax,
      entities,
      tentities,
      transform
    } = this.state;
    const { id, classes } = this.props;

    const onClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    function trunc(num) {
      return Number(num).toFixed(2);
    }

    const suggestedScaleX = Number(1 / (xmax - xmin)).toFixed(4);
    const suggestedScaleY = Number(1 / (ymax - ymin)).toFixed(4);

    const suggestedTranslateX = -((xmax - xmin) / 2 + xmin);
    const suggestedTranslateY = -((ymax - ymin) / 2 + xmin);

    const boundsjsx = (
      <div>
        BOUNDS:
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '100px repeat(3, 1fr)',
            columnGap: '10px'
          }}
        >
          <div />
          <div className={classes.inspectorLabelLeft}>Min</div>
          <div className={classes.inspectorLabelLeft}>Max</div>
          <div className={classes.inspectorLabelLeft}>Width/Height</div>
          <div className={classes.inspectorLabel}>X:&nbsp;</div>
          <div className={classes.inspectorData}>{xmin}</div>
          <div className={classes.inspectorData}>{xmax}</div>
          <div className={classes.inspectorData}>{xmax - xmin}</div>
          <div className={classes.inspectorLabel}>Y:&nbsp;</div>
          <div className={classes.inspectorData}>{ymin}</div>
          <div className={classes.inspectorData}>{ymax}</div>
          <div className={classes.inspectorData}>{ymax - ymin}</div>
        </div>
        <p>
          <i>
            Use these suggested values only as a starting place for exploring the
            right transforms. They are not meant to be definitive due to the
            jittery nature of the input data.
          </i>
        </p>
        <div>
          Suggested settings:
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr 100px 1fr'
            }}
          >
            <div className={classes.inspectorLabel}>ScaleX:&nbsp;</div>
            <div className={classes.inspectorData}>{suggestedScaleX}</div>
            <div className={classes.inspectorLabel}>TranslateX:&nbsp;</div>
            <div className={classes.inspectorData}>{suggestedTranslateX}</div>
            <div className={classes.inspectorLabel}>ScaleY:&nbsp;</div>
            <div className={classes.inspectorData}>{suggestedScaleY}</div>
            <div className={classes.inspectorLabel}>TranslateY:&nbsp;</div>
            <div className={classes.inspectorData}>{suggestedTranslateY}</div>
          </div>
          <br />
        </div>
      </div>
    );

    const transformsjsx = (
      <div>
        TRANSFORMS
        <br />
        <p>
          <i>
            In general, it's easiest to 1. set scale (so you can see the inputs),
            2. set rotation (so you can see screen orientation), then 3. set
            translation (so you can center the world).
          </i>
        </p>
        <p>
          <i>
            The algorithm is applied in this order: 1. rotate, 2. translate, 3.
            scale. Translate is applied to the already-rotated but pre-scaled
            input values in the original Pozyx mm units.
          </i>
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '100px 100px auto',
            columnGap: '5px'
          }}
        >
          <div className={classes.inspectorLabel}>ScaleX: </div>
          <input
            id="scaleX"
            value={transform.scaleX}
            type="number"
            onChange={this.onFormInputUpdate}
          />
          <i>Use a negative scale to flip</i>
          <div className={classes.inspectorLabel}>ScaleY: </div>
          <input
            id="scaleY"
            value={transform.scaleY}
            type="number"
            onChange={this.onFormInputUpdate}
          />
          <i />
          <div className={classes.inspectorLabel}>Rotate (deg): </div>
          <input
            id="rotate"
            value={transform.rotate}
            type="number"
            onChange={this.onFormInputUpdate}
          />
          <i>Counterclockwise</i>
          <div className={classes.inspectorLabel}>TranslateX (mm): </div>
          <input
            id="translateX"
            value={transform.translateX}
            type="number"
            onChange={this.onFormInputUpdate}
          />
          <i>Relative to rotated pozyx units</i>
          <div className={classes.inspectorLabel}>TranslateY (mm): </div>
          <input
            id="translateY"
            value={transform.translateY}
            type="number"
            onChange={this.onFormInputUpdate}
          />
          <i />
          <div className={classes.inspectorLabel}>Accelerometer: </div>
          <input
            id="useAccelerometer"
            checked={transform.useAccelerometer}
            type="checkbox"
            onChange={this.onFormInputUpdate}
          />
          <i>Only for wearable tags</i>
        </div>
        <br />
      </div>
    );

    const entjsx = (
      <div>
        ENTITIES -- raw | transformed
        <p>
          <i>
            The goal is to get the transformed units in the range of -0.5 to +0.5.
          </i>
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)'
          }}
        >
          <div>
            {entities.map(e => (
              <div
                key={e.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr 1fr',
                  gridTemplateRows: '1fr'
                }}
              >
                <div className={classes.inspectorData}>{e.id}</div>
                <div className={classes.inspectorData}>{trunc(e.x)}</div>
                <div className={classes.inspectorData}>{trunc(e.y)}</div>
              </div>
            ))}
          </div>
          <div>
            {tentities.map(e => (
              <div
                key={e.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)'
                }}
              >
                <div />
                <div className={classes.inspectorData}>{trunc(e.x)}</div>
                <div className={classes.inspectorData}>{trunc(e.y)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <PanelChrome id={id} title={title} onClick={onClick}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'wrap',
            fontSize: '12px',
            padding: '5px'
          }}
        >
          {boundsjsx}
          {transformsjsx}
          {entjsx}
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelTracker);
