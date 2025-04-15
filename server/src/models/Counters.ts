// Database operations
import { getDatabase } from "src/connectors/database";

// Utilities
import _ from "lodash";
import dayjs from "dayjs";
import { getIdentifier } from "src/util";

// Custom types
import { CounterModel, ICounter, ResponseData } from "@types";

const COUNTERS_COLLECTION = "counters"; // Collection name

export class Counters {
  static create = async (counter: ICounter): Promise<ResponseData<string>> => {
    const joinedCounter: CounterModel = {
      _id: getIdentifier("counter"),
      ...counter,
      created: dayjs(Date.now()).toISOString(),
    };

    const response = await getDatabase()
      .collection<CounterModel>(COUNTERS_COLLECTION)
      .insertOne(joinedCounter);
    const successStatus = _.isEqual(response.insertedId, joinedCounter._id);

    // Return the Counter identifier if successful
    return {
      success: successStatus,
      message: successStatus
        ? "Created new Counter"
        : "Unable to create Counter",
      data: response.insertedId.toString(),
    };
  };

  /**
   * Get a Counter associated with a unique identifier
   * @param _id Unique identifier of the Counter instance
   * @return {CounterModel}
   */
  static getCounter = async (_id: string): Promise<CounterModel | null> => {
    return await getDatabase()
      .collection<CounterModel>(COUNTERS_COLLECTION)
      .findOne({ _id: _id });
  };

  /**
   * Get all Counters associated with a Workspace
   * @param workspace The current Workspace
   * @return {Promise<CounterModel[]>}
   */
  static getCounters = async (workspace: string): Promise<CounterModel[]> => {
    return await getDatabase()
      .collection<CounterModel>(COUNTERS_COLLECTION)
      .find({ workspace: workspace })
      .toArray();
  };

  /**
   * Get the current Counter value based on the state of the Counter
   * @param _id Unique identifier of the Counter instance
   */
  static getCurrentValue = async (
    _id: string,
  ): Promise<ResponseData<string>> => {
    const counter = await Counters.getCounter(_id);

    // Cover the case of no Counter found
    if (_.isNull(counter)) {
      return {
        success: false,
        message: "Counter does not exist",
        data: "Invalid",
      };
    }

    // Generate the Counter value
    const generated = counter.format.replace("{}", counter.current.toString());

    // Return the value of the Counter, subsituting within the `format`
    return {
      success: true,
      message: `Generated current value for Counter "${counter.name}"`,
      data: generated,
    };
  };

  static getNextValue = async (_id: string): Promise<ResponseData<string>> => {
    const counter = await Counters.getCounter(_id);

    // Cover the case of no Counter found
    if (_.isNull(counter)) {
      return {
        success: false,
        message: "Counter does not exist",
        data: "Invalid",
      };
    }

    // Generate update object
    const update: { $set: ICounter } = {
      $set: {
        workspace: counter.workspace,
        name: counter.name,
        current: counter.current,
        increment: counter.increment,
        format: counter.format,
        created: counter.created,
      },
    };

    // Increment the Counter value and update
    update.$set.current = counter.current + counter.increment;

    // Update the stored Counter value
    const response = await getDatabase()
      .collection<CounterModel>(COUNTERS_COLLECTION)
      .updateOne({ _id: _id }, update);
    const successStatus = response.modifiedCount === 1;

    // Generate the Counter value
    const generated = counter.format.replace(
      "{}",
      update.$set.current.toString(),
    );

    return {
      success: successStatus,
      message: successStatus
        ? `Generated next value for Counter "${counter.name}"`
        : "Unable to generate next value",
      data: successStatus ? generated : "Invalid",
    };
  };
}
