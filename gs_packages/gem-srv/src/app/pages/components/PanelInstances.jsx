import React from 'react';
import UR from '@gemstep/ursys/client';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';
import Inspector from './Inspector';

class PanelInstances extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Sim Instances',
      instances: []
    };
    this.OnInstanceUpdate = this.OnInstanceUpdate.bind(this);
    this.OnInstanceClick = this.OnInstanceClick.bind(this);
    UR.RegisterMessage('HACK_INSTANCES_UPDATED', this.OnInstanceUpdate);
  }

  componentWillUnmount() {
    UR.UnregisterMessage('HACK_INSTANCES_UPDATED', this.OnInstanceUpdate);
  }

  OnInstanceUpdate(data) {
    this.setState({ instances: data });
  }

  OnInstanceClick(instanceName) {
    console.log('clicked on', instanceName);
  }

  render() {
    const { title, instances } = this.state;
    const { id, isActive, classes } = this.props;

    const typedInstances = {};
    instances.forEach(i => {
      if (typedInstances[i.blueprint] === undefined) {
        typedInstances[i.blueprint] = [i];
      } else {
        typedInstances[i.blueprint].push(i);
      }
    });
    const instanceArray = Object.keys(typedInstances).map(key => {
      return {
        agent: key,
        instances: [...typedInstances[key]]
      };
    });

    console.log('instanceyarray)', instanceArray);

    const onPanelChromeClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    return (
      // Placeholder for now
      <PanelChrome
        id={id}
        title={title}
        isActive={isActive}
        onClick={onPanelChromeClick}
      >
        <div // Panel Layout
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: '12px'
          }}
        >
          <span className={classes.instructions}>Click to Show/Hide</span>
          <div>
            {instanceArray.map(a => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap'
                }}
                key={a.agent}
              >
                {a.instances.map(i => (
                  <div key={`${a.agent}_${i.name}`}>
                    <button
                      style={{
                        flex: '0 1 auto',
                        height: '20px'
                      }}
                      className={
                        i.hidden
                          ? `${classes.instanceListItem} ${classes.instanceListItemInactive}`
                          : classes.instanceListItem
                      }
                      onClick={() => this.OnInstanceClick(i.name)}
                      type="button"
                    >
                      {i.name}
                    </button>
                    <Inspector agentName={i.name} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </PanelChrome>

      // simplify!  This works. Each agent is a row.  Rows wrap.
      // <>
      //   {instanceArray.map(a => (
      //     <div
      //       style={{
      //         display: 'flex',
      //         flexDirection: 'row',
      //         flexWrap: 'wrap'
      //       }}
      //     >
      //       {a.instances.map(i => (
      //         <div
      //           style={{
      //             flex: '0 1 auto',
      //             height: '20px'
      //           }}
      //           className={
      //             i.hidden
      //               ? `${classes.instanceListItem} ${classes.instanceListItemInactive}`
      //               : classes.instanceListItem
      //           }
      //           key={`${a.agent}_${i.name}`}
      //         >
      //           {i.name}
      //         </div>
      //       ))}
      //     </div>
      //   ))}
      // </>

      // just plop them all out
      // <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
      //   <div // Panel Layout
      //     style={{
      //       display: 'flex',
      //       flexDirection: 'column',
      //       fontSize: '12px'
      //     }}
      //   >
      //     <span className={classes.instructions}>Click to Show/Hide</span>
      //     <div>
      //       <div
      //         style={{
      //           display: 'grid',
      //           gridTemplateColumns: '1fr 1fr 1fr',
      //           gridAutoRows: '25px',
      //           gridAutoFlow: 'column'
      //         }}
      //       >
      //         {instances.map(i => (
      //           <div
      //             style={{ height: '20px' }}
      //             className={
      //               i.hidden
      //                 ? `${classes.instanceListItem} ${classes.instanceListItemInactive}`
      //                 : classes.instanceListItem
      //             }
      //             key={`${i.blueprint}_${i.name}`}
      //           >
      //             {i.name}
      //           </div>
      //         ))}
      //       </div>
      //     </div>
      //   </div>
      // </PanelChrome>

      // flex-based approach, but algae won't expand
      // <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
      //   <div // Panel Layout
      //     style={{
      //       display: 'flex',
      //       flexDirection: 'column',
      //       flexWrap: 'wrap',
      //       fontSize: '12px'
      //     }}
      //   >
      //     <span className={classes.instructions}>Click to Show/Hide</span>
      //     <div
      //       style={{
      //         display: 'flex',
      //         flexDirection: 'row',
      //         flexWrap: 'wrap'
      //       }}
      //     >
      //       {instanceArray.map(a => (
      //         <div
      //           className={classes.infoLabelColor}
      //           style={{
      //             display: 'flex',
      //             flexDirection: 'column',
      //             padding: '5px'
      //             // maxWidth: '120px'
      //           }}
      //           key={a.agent}
      //         >
      //           <div>{a.agent}</div>
      //           <div
      //             style={{
      //               display: 'flex',
      //               flexDirection: 'column',
      //               flexWrap: 'wrap'
      //             }}
      //           >
      //             {a.instances.map(i => (
      //               <div
      //                 style={{
      //                   flex: '1 1 160px',
      //                   height: '20px'
      //                 }}
      //                 className={
      //                   i.hidden
      //                     ? `${classes.instanceListItem} ${classes.instanceListItemInactive}`
      //                     : classes.instanceListItem
      //                 }
      //                 key={`${a.agent}_${i.name}`}
      //               >
      //                 {i.name}
      //               </div>
      //             ))}
      //           </div>
      //         </div>
      //       ))}
      //     </div>
      //   </div>
      // </PanelChrome>

      // <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
      //   <div
      //     style={{
      //       display: 'flex',
      //       flexDirection: 'column',
      //       flexWrap: 'wrap',
      //       fontSize: '12px'
      //     }}
      //   >
      //     <span className={classes.instructions}>Click to Show/Hide</span>
      //     <div
      //       style={{
      //         display: 'grid',
      //         gridTemplateRows: '1fr',
      //         gridTemplateColumns: '1fr 1fr 1fr'
      //       }}
      //     >
      //       {instanceArray.map(a => (
      //         <div
      //           className={classes.infoLabelColor}
      //           style={{
      //             display: 'grid',
      //             gridTemplateAreas: '"head" "list"',
      //             gridTemplateRows: '20px 300px',
      //             padding: '5px'
      //           }}
      //           key={a.agent}
      //         >
      //           <div style={{ gridArea: 'head' }}>{a.agent}</div>
      //           <div
      //             style={{
      //               gridArea: 'list',
      //               display: 'grid',
      //               // alignItems: 'start',
      //               // justifyContent: 'start',
      //               gridTemplateColumns: '1fr 1fr',
      //               gridAutoFlow: 'column'
      //             }}
      //           >
      //             {a.instances.map(i => (
      //               <div
      //                 style={{ height: '20px' }}
      //                 className={
      //                   i.hidden
      //                     ? `${classes.instanceListItem} ${classes.instanceListItemInactive}`
      //                     : classes.instanceListItem
      //                 }
      //                 key={`${a.agent}_${i.name}`}
      //               >
      //                 {i.name}
      //               </div>
      //             ))}
      //           </div>
      //         </div>
      //       ))}
      //     </div>
      //   </div>
      // </PanelChrome>

      // <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
      //   <div
      //     style={{
      //       display: 'flex',
      //       flexDirection: 'column',
      //       flexWrap: 'wrap',
      //       fontSize: '12px'
      //     }}
      //   >
      //     <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      //       {instanceArray.map(a => (
      //         <div
      //           className={classes.infoLabelColor}
      //           style={{
      //             display: 'flex',
      //             flexDirection: 'column',
      //             flexWrap: 'wrap',
      //             padding: '5px'
      //           }}
      //           key={a.agent}
      //         >
      //           {a.agent}
      //           {a.instances.map(i => (
      //             <div
      //               className={
      //                 i.hidden
      //                   ? `${classes.instanceListItem} ${classes.instanceListItemInactive}`
      //                   : classes.instanceListItem
      //               }
      //               key={`${a.agent}_${i.name}`}
      //             >
      //               {i.name}
      //             </div>
      //           ))}
      //         </div>
      //       ))}
      //     </div>
      //     <span className={classes.instructions}>Click to Show/Hide</span>
      //   </div>
      // </PanelChrome>
    );
  }
}

export default withStyles(useStylesHOC)(PanelInstances);
