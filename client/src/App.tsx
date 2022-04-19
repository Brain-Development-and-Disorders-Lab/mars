import React, { Component } from 'react';
import {
  Box,
  Button,
  Collapsible,
  Heading,
  Grommet,
  Layer,
  ResponsiveContext,
  Anchor,
} from 'grommet';
import { AddCircle, Catalog, FormClose, List, Notification } from 'grommet-icons';
import "@fontsource/roboto";

// Custom components
import Navigation from './components/Navigation';
import Sidebar from './components/Sidebar';

// Theme
import { theme } from './theme';

class App extends Component {
  state = {
    showSidebar: false,
  }

  render() {
    const { showSidebar } = this.state;

    return (
      <Grommet theme={theme} full>
        <ResponsiveContext.Consumer>
          {size => (
            <Box fill>
              <Navigation>
                <Heading level='3' margin='none'><Anchor href='/' label='SampleFlow' /></Heading>
                <Box flex
                  direction='row'
                  gap='xlarge'
                  pad={{ left: 'medium', right: 'small', vertical: 'small' }}
                >
                  <Box direction='row' gap='small'>
                    <AddCircle />
                    <Heading level='4' margin='none'>Create</Heading>
                  </Box>
                  <Box direction='row' gap='small'>
                    <List />
                    <Heading level='4' margin='none'>Projects</Heading>
                  </Box>
                  <Box direction='row' gap='small'>
                    <Catalog />
                    <Heading level='4' margin='none'>Samples</Heading>
                  </Box>
                </Box>
                <Button
                  icon={<Notification />}
                  onClick={() => this.setState({ showSidebar: !this.state.showSidebar })}
                />
              </Navigation>
              <Box direction='row' flex overflow={{ horizontal: 'hidden' }} pad='small'>
                <Box flex align='left'>
                  <Heading level='2'>Home</Heading>
                </Box>
                {(!showSidebar || size !== 'small') ? (
                  <Collapsible direction="horizontal" open={showSidebar}>
                    <Box
                      flex
                      width='medium'
                      background='light-2'
                      elevation='small'
                      align='center'
                    >
                      <Sidebar />
                    </Box>
                  </Collapsible>
                ): (
                  <Layer>
                    <Box
                      background='light-2'
                      tag='header'
                      justify='end'
                      align='center'
                      direction='row'
                    >
                      <Button
                        icon={<FormClose />}
                        onClick={() => this.setState({ showSidebar: false })}
                      />
                    </Box>
                    <Box
                      fill
                      background='light-2'
                      align='center'
                      justify='center'
                    >
                      <Sidebar />
                    </Box>
                  </Layer>
                )}
              </Box>
            </Box>
          )}
        </ResponsiveContext.Consumer>
      </Grommet>
    );
  }
}

export default App;
