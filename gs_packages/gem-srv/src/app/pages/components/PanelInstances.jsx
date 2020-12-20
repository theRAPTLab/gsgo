import React from 'react';
import * as DATACORE from 'modules/datacore';
import { withStyles } from '@material-ui/core/styles';
import { useStylesHOC } from '../elements/page-xui-styles';

import PanelChrome from './PanelChrome';

class PanelInstances extends React.Component {
  constructor() {
    super();
    this.state = {
      title: 'Sim Instances (Fake Data)'
    };
  }

  render() {
    const { title } = this.state;
    const { id, isActive, classes } = this.props;

    // const allInstances = [
    //   {
    //     agent: 'Fish',
    //     instances: [
    //       { label: 'Fish01' },
    //       { label: 'Fish02', hidden: true },
    //       { label: 'Fish03' }
    //     ]
    //   },
    //   {
    //     agent: 'Algae',
    //     instances: [
    //       { label: 'Algae01' },
    //       { label: 'Algae02' },
    //       { label: 'Algae03' },
    //       { label: 'Algae04' },
    //       { label: 'Algae05' },
    //       { label: 'Algae06', hidden: true },
    //       { label: 'Algae07', hidden: true },
    //       { label: 'Algae08' },
    //       { label: 'Algae09', hidden: true },
    //       { label: 'Algae10' }
    //     ]
    //   },
    //   {
    //     agent: 'LightBeam',
    //     instances: [{ label: 'LightBeam01' }]
    //   }
    // ];

    // TEST GetAllInstances Call
    // This only works if SIM has been initialized.
    // Skip this for now and just hard code.
    // const instances = DATACORE.GetAllInstances();
    // console.error('GetAllInstances gets', instances);

    // FAKE DATA
    const instances = [
      {
        blueprint: 'Fish',
        name: 'Fish01'
      },
      {
        blueprint: 'Fish',
        name: 'Fish02'
      },
      {
        blueprint: 'Fish',
        name: 'Fish03',
        hidden: true
      },
      {
        blueprint: 'Algae',
        name: 'Algae01'
      },
      {
        blueprint: 'Algae',
        name: 'Algae02'
      },
      {
        blueprint: 'Algae',
        name: 'Algae03',
        hidden: true
      },
      {
        blueprint: 'Algae',
        name: 'Algae04'
      },
      {
        blueprint: 'Algae',
        name: 'Algae05',
        hidden: true
      },
      {
        blueprint: 'Algae',
        name: 'Algae06',
        hidden: true
      },
      {
        blueprint: 'Algae',
        name: 'Algae07'
      },
      {
        blueprint: 'Algae',
        name: 'Algae08'
      },
      {
        blueprint: 'Algae',
        name: 'Algae09'
      },
      {
        blueprint: 'Algae',
        name: 'Algae10'
      },
      {
        blueprint: 'Algae',
        name: 'Algae11'
      },
      {
        blueprint: 'LightBeam',
        name: 'LightBeam01'
      }
    ];
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

    const onClick = () => {
      // To be implemented
      console.log('Show instance');
    };

    return (
      // Placeholder for now
      <PanelChrome id={id} title={title} isActive={isActive} onClick={onClick}>
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
                  <div
                    style={{
                      flex: '0 1 auto',
                      height: '20px'
                    }}
                    className={
                      i.hidden
                        ? `${classes.instanceListItem} ${classes.instanceListItemInactive}`
                        : classes.instanceListItem
                    }
                    key={`${a.agent}_${i.name}`}
                  >
                    {i.name}
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
