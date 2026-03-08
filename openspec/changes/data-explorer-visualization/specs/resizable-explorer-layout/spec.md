## ADDED Requirements

### Requirement: Draggable Splitter
The system SHALL provide a draggable vertical divider (splitter) between the Chart panel and the Results Table.

#### Scenario: Resize panels
- **WHEN** the user drags the splitter to the right
- **THEN** the Chart panel width SHALL increase and the Results Table width SHALL decrease proportionally

### Requirement: Default Layout
The system SHALL surface the Chart and Table in a 60%/40% split by default on first load.

#### Scenario: First-time user
- **WHEN** the user uploads a file and runs a query for the first time
- **THEN** they SHALL see the Chart panel occupying 60% of the available width

### Requirement: Collapse Threshold
The system SHALL allow panels to be collapsed if their width is reduced below 100px.

#### Scenario: Collapse Chart panel
- **WHEN** the user drags the splitter to the left until the Chart panel is < 100px
- **THEN** the Chart panel SHALL snap to a collapsed state (width 0 or minimal icon)

### Requirement: Size Persistence
The system SHALL persist the panel widths to LocalStorage so they are maintained across page reloads.

#### Scenario: Persistent layout
- **WHEN** the user resizes the Chart panel to 50% and reloads the page
- **THEN** on reload, the Chart panel SHALL restore to its 50% width

### Requirement: Responsive Proportions
The system SHALL maintain the relative proportions of Chart and Table panels when the browser window is resized.

#### Scenario: Resize browser window
- **WHEN** the browser window width is halved
- **THEN** both Chart and Table panels SHALL resize to half their absolute width while maintaining their relative percentage
