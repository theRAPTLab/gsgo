import React from 'react';
import UR from '@gemstep/ursys/client';
import * as INPUT from 'modules/input/api-input';
import { TYPES } from 'modules/step/lib/class-ptrack-endpoint';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';
import { ACLocales } from '../../../modules/appcore';

import PanelChrome from './PanelChrome';
import EntityObject from '../../../modules/step/lib/class-entity-object';

/// CONSTANTS & DECLARATIONS //////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const PR = UR.PrefixUtil('PanelTracker');
const DBG = true;

/// CLASS DECLARATION /////////////////////////////////////////////////////////
/// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
class PanelTracker extends React.Component {
  constructor() {
    super();
    const { selectedTrack } = UR.ReadFlatStateGroups('locales');
    this.state = {
      isInitialized: false,
      title: 'Tracker Data',
      xmin: Infinity,
      xmax: -Infinity,
      ymin: Infinity,
      ymax: -Infinity,
      selectedTrack,
      entities: [],
      tentities: []
    };

    this.init = this.init.bind(this);
    this.update = this.update.bind(this);
    this.urStateUpdated = this.urStateUpdated.bind(this);

    UR.HandleMessage('TRACKER_SETUP_UPDATE', this.update);
  }

  componentDidMount() {
    UR.SubscribeState('locales', this.urStateUpdated);
    this.init();
  }

  componentWillUnmount() {
    INPUT.StopTrackerEmitter();
    UR.UnhandleMessage('TRACKER_SETUP_UPDATE', this.update);
    UR.UnsubscribeState('locales', this.urStateUpdated);
  }

  async init() {
    // eslint-disable-next-line react/destructuring-assignment
    if (this.state.isInitialized) return;
    this.setState({ isInitialized: true });
    UR.CallMessage('NET:TRANSFORM_REQ');
    INPUT.StartTrackerEmitter();
  }

  update(data) {
    const { selectedTrack } = this.state;
    const { entities, tentities } = data;

    console.log('selectedTrack', selectedTrack, entities);

    // Filter by Ptrack only
    const filteredEntities = entities.filter(e => {
      if (selectedTrack === 'ptrack') return ['ob', 'pp', 'po'].includes(e.type);
      if (selectedTrack === 'pozyx') return ['pz'].includes(e.type);
      return false;
    });

    // Calculate Limits
    const x = filteredEntities.map(e => e.x);
    const y = filteredEntities.map(e => e.y);
    this.setState(state => {
      return {
        xmin: Math.min(state.xmin, ...x),
        xmax: Math.max(state.xmax, ...x),
        ymin: Math.min(state.ymin, ...y),
        ymax: Math.max(state.ymax, ...y),
        entities: filteredEntities,
        tentities
      };
    });
  }

  urStateUpdated(stateObj, cb) {
    const { selectedTrack } = stateObj;
    this.setState({
      selectedTrack,
      xmin: Infinity,
      xmax: -Infinity,
      ymin: Infinity,
      ymax: -Infinity
    });
  }

  render() {
    const { title, xmin, xmax, ymin, ymax, entities, tentities } = this.state;
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

    const suggestedTranslateX = -((xmax - xmin) / 2 + xmin) || 0;
    const suggestedTranslateY = -((ymax - ymin) / 2 + xmin) || 0;

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
            <div className={classes.inspectorLabel}>X-SCALE:&nbsp;</div>
            <div className={classes.inspectorData}>{suggestedScaleX}</div>
            <div className={classes.inspectorLabel}>X-OFFSET:&nbsp;</div>
            <div className={classes.inspectorData}>{suggestedTranslateX}</div>
            <div className={classes.inspectorLabel}>Y-SCALE:&nbsp;</div>
            <div className={classes.inspectorData}>{suggestedScaleY}</div>
            <div className={classes.inspectorLabel}>Y-OFFSET:&nbsp;</div>
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
        <p>
          <li>Scale: Use a negative scale to flip</li>
          <li>Rotation: measured in degrees counterclockwise</li>
          <li>Translate/Offset: Relative to rotated pozyx raw units</li>
        </p>
        <br />
      </div>
    );

    const entjsx = (
      <div>
        ENTITIES -- raw | transformed
        <p>
          <i>
            The goal is to get the transformed units in the range of -1 to +1.
          </i>
        </p>
        <div
          style={{
            display: 'grid'
          }}
        >
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr 1fr 1fr 1fr 1fr',
                gridTemplateRows: '1fr'
              }}
            >
              <div className={classes.inspectorData}>ID</div>
              <div className={classes.inspectorData}>RawX</div>
              <div className={classes.inspectorData}>XformX</div>
              <div className={classes.inspectorData}>&nbsp;</div>
              <div className={classes.inspectorData}>RawY</div>
              <div className={classes.inspectorData}>XformY</div>
            </div>
            {entities.map(e => {
              const t = tentities.find(t => t.id === e.id);
              return (
                <div
                  key={e.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 1fr 1fr 1fr 1fr',
                    gridTemplateRows: '1fr'
                  }}
                >
                  <div className={classes.inspectorData}>{e.id}</div>
                  <div className={classes.inspectorData}>{trunc(e.x)}</div>
                  <div className={classes.inspectorData}>{trunc(t.x)}</div>
                  <div className={classes.inspectorData}>&nbsp;</div>
                  <div className={classes.inspectorData}>{trunc(e.y)}</div>
                  <div className={classes.inspectorData}>{trunc(t.y)}</div>
                </div>
              );
            })}
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
