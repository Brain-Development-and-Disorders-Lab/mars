// Seed script to generate comprehensive test data for MongoDB
import "dotenv/config";
import { connect, disconnect } from "../connectors/database";
import { Entities } from "../models/Entities";
import { Projects } from "../models/Projects";
import { Templates } from "../models/Templates";
import { Activity } from "../models/Activity";
import { Workspaces } from "../models/Workspaces";
import { Users } from "../models/Users";
import { getIdentifier } from "../util";
import dayjs from "dayjs";
import consola from "consola";
import {
  IEntity,
  IProject,
  IAttribute,
  IActivity,
  IRelationship,
  AttributeModel,
  RelationshipType,
  IValueType,
  IWorkspace,
} from "@types";
import { DEMO_USER_ORCID } from "../variables";

// Configuration
const NUM_ENTITIES = 10000;
const NUM_PROJECTS = 200;
const NUM_TEMPLATES = 100;
const MIN_ENTITIES_PER_PROJECT = 50;
const MIN_VALUES_PER_TEMPLATE = 15;
const MIN_ENTITIES_WITH_RELATIONSHIPS = 200;
const ACTIVITY_WEEKS = 8;
const WORKSPACE_NAME = "Test Data Workspace";
const WORKSPACE_DESCRIPTION =
  "Comprehensive test dataset for application scale testing";

// Sample data pools
const ENTITY_NAMES = [
  "Sample A1",
  "Sample B2",
  "Sample C3",
  "Tissue Block Alpha",
  "Tissue Block Beta",
  "Tissue Block Gamma",
  "Antibody Primary",
  "Antibody Secondary",
  "Microscope Slide 001",
  "Microscope Slide 002",
  "DNA Extraction Kit",
  "RNA Extraction Kit",
  "PCR Reaction Mix",
  "Gel Electrophoresis",
  "Western Blot Membrane",
  "Cell Culture Flask",
  "Petri Dish Culture",
  "Bacterial Colony",
  "Viral Stock",
  "Protein Solution",
  "Enzyme Preparation",
  "Buffer Solution",
  "Reagent Mix",
  "Calibration Standard",
  "Control Sample",
  "Test Sample",
  "Reference Material",
  "Quality Control",
  "Blank Sample",
  "Spike Sample",
];

const PROJECT_NAMES = [
  "Cancer Research Initiative",
  "Neuroscience Study",
  "Immunology Project",
  "Genomics Analysis",
  "Proteomics Investigation",
  "Metabolomics Research",
  "Drug Discovery Program",
  "Biomarker Development",
  "Clinical Trial Phase I",
  "Clinical Trial Phase II",
  "Preclinical Studies",
  "Toxicology Assessment",
  "Pharmacokinetics Study",
  "Biochemistry Analysis",
  "Molecular Biology Research",
  "Cell Biology Project",
  "Developmental Biology",
  "Evolutionary Biology",
  "Ecology Research",
  "Environmental Science",
];

const TEMPLATE_NAMES = [
  "Sample Metadata",
  "Experimental Conditions",
  "Instrument Settings",
  "Quality Metrics",
  "Storage Information",
  "Processing Details",
  "Analysis Parameters",
  "Measurement Data",
  "Location Tracking",
  "Chain of Custody",
  "Biological Properties",
  "Chemical Properties",
  "Physical Properties",
  "Environmental Conditions",
  "Safety Information",
  "Compliance Data",
  "Documentation Links",
  "Related Publications",
  "Funding Information",
  "Collaboration Details",
];

const VALUE_NAMES = [
  "Temperature",
  "pH",
  "Concentration",
  "Volume",
  "Weight",
  "Date",
  "Time",
  "Location",
  "Operator",
  "Instrument",
  "Method",
  "Protocol",
  "Batch Number",
  "Lot Number",
  "Serial Number",
  "Expiration Date",
  "Storage Temperature",
  "Storage Location",
  "Status",
  "Notes",
];

const RELATIONSHIP_TYPES: RelationshipType[] = ["parent", "child", "general"];

const ACTIVITY_TYPES: IActivity["type"][] = [
  "create",
  "update",
  "delete",
  "archived",
];

// Helper functions
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
  return dayjs(date).toISOString();
}

function generateValue(
  type: IValueType,
  index: number,
  entityIds?: string[],
): { _id: string; name: string; type: IValueType; data: unknown } {
  const name = VALUE_NAMES[index % VALUE_NAMES.length] || `Value ${index + 1}`;
  let data: unknown;

  switch (type) {
    case "number":
      data = Math.random() * 1000;
      break;
    case "text":
      data = `Sample text data for ${name}`;
      break;
    case "url":
      data = `https://example.com/resource/${index}`;
      break;
    case "date":
      data = randomDate(
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        new Date(),
      );
      break;
    case "entity":
      // Use a random entity ID if available, otherwise use empty string
      data = entityIds && entityIds.length > 0 ? randomElement(entityIds) : "";
      break;
    case "select":
      data = randomElement(["Option A", "Option B", "Option C", "Option D"]);
      break;
    default:
      data = `Data for ${name}`;
  }

  return {
    _id: getIdentifier("template").replace("t", "v"), // Value ID
    name,
    type,
    data,
  };
}

// Generate Templates
async function generateTemplates(): Promise<AttributeModel[]> {
  consola.info(`Generating ${NUM_TEMPLATES} templates...`);
  const templates: AttributeModel[] = [];

  // Exclude "entity" type from initial template generation to avoid dependency issues
  const valueTypes: IValueType[] = ["number", "text", "url", "date", "select"];

  for (let i = 0; i < NUM_TEMPLATES; i++) {
    const templateName = TEMPLATE_NAMES[i] || `Template ${i + 1}`;
    const numValues = randomInt(MIN_VALUES_PER_TEMPLATE, 15);

    const values = Array.from({ length: numValues }, (_, idx) => {
      const type = valueTypes[idx % valueTypes.length];
      return generateValue(type, idx);
    });

    const template: IAttribute = {
      name: templateName,
      owner: DEMO_USER_ORCID,
      description: `Template for ${templateName.toLowerCase()} with ${numValues} values`,
      archived: Math.random() < 0.1, // 10% archived
      values,
    };

    const result = await Templates.create(template);
    if (result.success) {
      const createdTemplate = await Templates.getOne(result.data);
      if (createdTemplate) {
        templates.push(createdTemplate);
      }
    }
  }

  consola.success(`Generated ${templates.length} templates`);
  return templates;
}

// Generate Entities
async function generateEntities(
  templates: AttributeModel[],
  projectIds: string[],
): Promise<string[]> {
  consola.info(`Generating ${NUM_ENTITIES} entities...`);
  const entityIds: string[] = [];

  // First, create all entities without relationships
  for (let i = 0; i < NUM_ENTITIES; i++) {
    const entityName =
      ENTITY_NAMES[i % ENTITY_NAMES.length] || `Entity ${i + 1}`;
    const numProjects = randomInt(1, 3);
    const selectedProjects = randomElements(projectIds, numProjects);

    // Assign templates to at least 50% of entities
    const useTemplate = Math.random() < 0.6; // 60% use templates
    const attributes: AttributeModel[] = [];

    if (useTemplate && templates.length > 0) {
      const numTemplates = randomInt(1, 3);
      const selectedTemplates = randomElements(templates, numTemplates);

      selectedTemplates.forEach((template) => {
        // Create an attribute instance from the template
        const attribute: AttributeModel = {
          ...template,
          _id: getIdentifier("template").replace("t", "a"), // Attribute ID
          timestamp: dayjs().toISOString(),
          values: template.values.map((value) => ({
            ...value,
            _id: getIdentifier("template").replace("t", "v"),
            // Keep the original data
            data: value.data,
          })),
        };
        attributes.push(attribute);
      });
    }

    const entity: IEntity = {
      name: `${entityName} ${i + 1}`,
      owner: DEMO_USER_ORCID,
      archived: Math.random() < 0.05, // 5% archived
      created: randomDate(
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        new Date(),
      ),
      description: `Test entity ${i + 1} for comprehensive dataset`,
      projects: selectedProjects,
      relationships: [],
      attributes,
      attachments: [],
      history: [],
    };

    const result = await Entities.create(entity);
    if (result.success) {
      entityIds.push(result.data);
    }
  }

  consola.success(`Generated ${entityIds.length} entities`);

  // Now add relationships to at least MIN_ENTITIES_WITH_RELATIONSHIPS entities
  consola.info(
    `Adding relationships to ${MIN_ENTITIES_WITH_RELATIONSHIPS} entities...`,
  );
  const entitiesWithRelationships = randomElements(
    entityIds,
    Math.max(MIN_ENTITIES_WITH_RELATIONSHIPS, entityIds.length * 0.1),
  );

  for (const sourceId of entitiesWithRelationships) {
    const sourceEntity = await Entities.getOne(sourceId);
    if (!sourceEntity) continue;

    // Create 1-3 relationships per entity
    const numRelationships = randomInt(1, 3);
    const availableTargets = entityIds.filter((id) => id !== sourceId);
    const targets = randomElements(availableTargets, numRelationships);

    for (const targetId of targets) {
      const targetEntity = await Entities.getOne(targetId);
      if (!targetEntity) continue;

      const relationship: IRelationship = {
        type: randomElement(RELATIONSHIP_TYPES),
        source: {
          _id: sourceId,
          name: sourceEntity.name,
        },
        target: {
          _id: targetId,
          name: targetEntity.name,
        },
      };

      // Add relationship using the model method
      await Entities.addRelationship(relationship);
    }
  }

  consola.success(
    `Added relationships to ${entitiesWithRelationships.length} entities`,
  );

  return entityIds;
}

// Generate Projects
async function generateProjects(): Promise<string[]> {
  consola.info(`Generating ${NUM_PROJECTS} projects...`);
  const projectIds: string[] = [];

  for (let i = 0; i < NUM_PROJECTS; i++) {
    const projectName = PROJECT_NAMES[i] || `Project ${i + 1}`;

    const project: IProject = {
      name: projectName,
      owner: DEMO_USER_ORCID,
      archived: Math.random() < 0.1, // 10% archived
      created: randomDate(
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        new Date(),
      ),
      collaborators: [],
      description: `Test project ${i + 1} for comprehensive dataset`,
      entities: [], // Will be populated after entities are created
      history: [],
    };

    const result = await Projects.create(project);
    if (result.success) {
      projectIds.push(result.data);
    }
  }

  consola.success(`Generated ${projectIds.length} projects`);
  return projectIds;
}

// Assign entities to projects
async function assignEntitiesToProjects(
  entityIds: string[],
  projectIds: string[],
): Promise<void> {
  consola.info("Assigning entities to projects...");

  for (const projectId of projectIds) {
    const numEntities = randomInt(
      MIN_ENTITIES_PER_PROJECT,
      Math.min(15, entityIds.length),
    );
    const selectedEntities = randomElements(entityIds, numEntities);

    const project = await Projects.getOne(projectId);
    if (!project) continue;

    // Update project with entities (bidirectional relationship)
    for (const entityId of selectedEntities) {
      await Entities.addProject(entityId, projectId);
      await Projects.addEntity(projectId, entityId);
    }
  }

  consola.success("Assigned entities to projects");
}

// Generate Activity entries
async function generateActivity(
  entityIds: string[],
  projectIds: string[],
  templateIds: string[],
  activityIds: string[],
): Promise<void> {
  consola.info("Generating activity entries...");

  const startDate = new Date(
    Date.now() - ACTIVITY_WEEKS * 7 * 24 * 60 * 60 * 1000,
  );
  const endDate = new Date();
  const allTargets = [
    ...entityIds.map((id) => ({ type: "entities" as const, id })),
    ...projectIds.map((id) => ({ type: "projects" as const, id })),
    ...templateIds.map((id) => ({ type: "templates" as const, id })),
  ];

  // Generate activity entries spread over the time period
  const numActivities = randomInt(100, 200);
  const activities: IActivity[] = [];

  for (let i = 0; i < numActivities; i++) {
    const target = randomElement(allTargets);
    let targetName = "";

    // Get target name
    if (target.type === "entities") {
      const entity = await Entities.getOne(target.id);
      targetName = entity?.name || `Entity ${target.id}`;
    } else if (target.type === "projects") {
      const project = await Projects.getOne(target.id);
      targetName = project?.name || `Project ${target.id}`;
    } else {
      const template = await Templates.getOne(target.id);
      targetName = template?.name || `Template ${target.id}`;
    }

    const activity: IActivity = {
      timestamp: randomDate(startDate, endDate),
      type: randomElement(ACTIVITY_TYPES),
      details: `${randomElement(ACTIVITY_TYPES)} operation on ${target.type}`,
      target: {
        type: target.type,
        _id: target.id,
        name: targetName,
      },
      actor: DEMO_USER_ORCID,
    };

    activities.push(activity);
  }

  // Sort by timestamp and create
  activities.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  for (const activity of activities) {
    const result = await Activity.create(activity);
    if (result.success) {
      activityIds.push(result.data);
    }
  }

  consola.success(`Generated ${activityIds.length} activity entries`);
}

// Ensure test user exists and has access to workspace
async function ensureTestUser(workspaceId: string): Promise<void> {
  consola.info("Ensuring test user exists...");
  const user = await Users.getOne(DEMO_USER_ORCID);
  if (!user) {
    consola.info("Creating test user...");
    await Users.create({
      _id: DEMO_USER_ORCID,
      firstName: "Demo",
      lastName: "User",
      email: "demo@metadatify.com",
      affiliation: "Test Organization",
      lastLogin: dayjs().toISOString(),
      token: "test_token",
      workspaces: [workspaceId],
      api_keys: [],
    });
    consola.success("Created test user");
  } else {
    // Add workspace to user if not already present
    if (!user.workspaces.includes(workspaceId)) {
      user.workspaces.push(workspaceId);
      await Users.update(user);
      consola.info("Added workspace to existing user");
    } else {
      consola.info("User already has access to workspace");
    }
  }
}

// Create workspace
async function createWorkspace(): Promise<string> {
  consola.info("Creating workspace...");
  const workspace: IWorkspace = {
    name: WORKSPACE_NAME,
    owner: DEMO_USER_ORCID,
    public: false,
    description: WORKSPACE_DESCRIPTION,
    collaborators: [],
    entities: [],
    projects: [],
    templates: [],
    activity: [],
  };

  const result = await Workspaces.create(workspace);
  if (!result.success) {
    throw new Error("Failed to create workspace");
  }

  consola.success(`Created workspace: ${result.data}`);
  return result.data;
}

// Associate all data with workspace
async function associateDataWithWorkspace(
  workspaceId: string,
  entityIds: string[],
  projectIds: string[],
  templateIds: string[],
  activityIds: string[],
): Promise<void> {
  consola.info("Associating data with workspace...");

  // Add entities
  for (const entityId of entityIds) {
    await Workspaces.addEntity(workspaceId, entityId);
  }
  consola.info(`Added ${entityIds.length} entities to workspace`);

  // Add projects
  for (const projectId of projectIds) {
    await Workspaces.addProject(workspaceId, projectId);
  }
  consola.info(`Added ${projectIds.length} projects to workspace`);

  // Add templates
  for (const templateId of templateIds) {
    await Workspaces.addTemplate(workspaceId, templateId);
  }
  consola.info(`Added ${templateIds.length} templates to workspace`);

  // Add activity
  for (const activityId of activityIds) {
    await Workspaces.addActivity(workspaceId, activityId);
  }
  consola.info(`Added ${activityIds.length} activity entries to workspace`);

  consola.success("All data associated with workspace");
}

// Main seeding function
async function seedDatabase(): Promise<void> {
  try {
    consola.start("Starting database seeding...");

    // Connect to database
    await connect();
    consola.success("Connected to database");

    // Create workspace first
    const workspaceId = await createWorkspace();

    // Ensure test user exists and has access
    await ensureTestUser(workspaceId);

    // Generate in order: Templates -> Projects -> Entities -> Relationships -> Activity
    const templates = await generateTemplates();
    const templateIds = templates.map((t) => t._id);

    const projectIds = await generateProjects();

    const entityIds = await generateEntities(templates, projectIds);

    await assignEntitiesToProjects(entityIds, projectIds);

    const activityIds: string[] = [];
    await generateActivity(entityIds, projectIds, templateIds, activityIds);

    // Associate all data with workspace
    await associateDataWithWorkspace(
      workspaceId,
      entityIds,
      projectIds,
      templateIds,
      activityIds,
    );

    consola.success("Database seeding completed successfully!");
    consola.info(`Summary:`);
    consola.info(`  - Workspace: ${workspaceId}`);
    consola.info(`  - Templates: ${templates.length}`);
    consola.info(`  - Projects: ${projectIds.length}`);
    consola.info(`  - Entities: ${entityIds.length}`);
    consola.info(`  - Activity entries: ${activityIds.length}`);

    await disconnect();
  } catch (error) {
    consola.error("Error seeding database:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      consola.success("Seeding script completed");
      process.exit(0);
    })
    .catch((error) => {
      consola.error("Seeding script failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };
