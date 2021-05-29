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
      xmin: 0,
      xmax: 0,
      ymin: 0,
      ymax: 0,
      entities: [],
      tentities: [],
      transform: {
        scaleX: 1,
        scaleY: 1,
        translateX: 0,
        translateY: 0,
        rotate: 0
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
    data[e.target.id] = e.target.value;
    this.setState({});
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
        <br />
        <div>
          Suggested scale:
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 1fr',
              gridTemplateRows: 'repeat(2, 1fr)'
            }}
          >
            <div className={classes.inspectorLabel}>X:&nbsp;</div>
            <div className={classes.inspectorData}>
              {Number(1 / (xmax - xmin)).toFixed(4)}
            </div>
            <div className={classes.inspectorLabel}>Y:&nbsp;</div>
            <div className={classes.inspectorData}>
              {Number(1 / (ymax - ymin)).toFixed(4)}
            </div>
          </div>
        </div>
      </div>
    );

    const transformsjsx = (
      <div>
        TRANSFORMS
        <br />
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
          <div className={classes.inspectorLabel}>TranslateX (mm): </div>
          <input
            id="translateX"
            value={transform.translateX}
            type="number"
            onChange={this.onFormInputUpdate}
          />
          <i>Relative to pozyx units</i>
          <div className={classes.inspectorLabel}>TranslateY (mm): </div>
          <input
            id="translateY"
            value={transform.translateY}
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
        </div>
      </div>
    );

    const entjsx = (
      <div>
        ENTITIES -- raw | transformed
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
          <br />
          <hr />
          <br />
          {transformsjsx}
          <br />
          <hr />
          <br />
          {entjsx}
        </div>
      </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelTracker);
