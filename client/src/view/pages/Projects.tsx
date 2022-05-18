import {
  Button,
  Heading,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Text,
} from "grommet";
import React, { Component } from "react";

class Projects extends Component {
  render() {
    return (
      <>
        <Heading>Projects</Heading>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell scope="col" border="bottom">
                Project ID
              </TableCell>
              <TableCell scope="col" border="bottom">
                Project Name
              </TableCell>
              <TableCell scope="col" border="bottom">
                Project Category
              </TableCell>
              <TableCell scope="col" border="bottom">
                Last Update
              </TableCell>
              <TableCell scope="col" border="bottom">
                Access
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell scope="row" border="right">
                <strong>dunnart1234</strong>
              </TableCell>
              <TableCell>
                <strong>Prey Capture</strong>
              </TableCell>
              <TableCell>
                <Text>Dunnart</Text>
              </TableCell>
              <TableCell>
                <strong>Today</strong> at 14:17.43 by Henry
              </TableCell>
              <TableCell>
                <Button primary label="Go" />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" border="right">
                <strong>ccddm2020</strong>
              </TableCell>
              <TableCell>
                <strong>Metacognition in CCD</strong>
              </TableCell>
              <TableCell>
                <Text>Human</Text>
              </TableCell>
              <TableCell>
                <strong>Today</strong> at 12:23.29 by Henry
              </TableCell>
              <TableCell>
                <Button primary label="Go" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </>
    );
  }
}

export default Projects;
