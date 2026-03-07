## ADDED Requirements

### Requirement: File upload via drag and drop
The system SHALL provide a drag-and-drop zone that allows users to upload CSV, Parquet, and GeoJSON files for analysis.

#### Scenario: Successful file upload
- **WHEN** user drags a CSV file over the drop zone
- **THEN** system shows visual feedback highlighting the drop zone
- **WHEN** user releases the file over the drop zone
- **THEN** system displays progress indicator and begins file processing
- **WHEN** file processing completes successfully
- **THEN** system shows file details and transitions to main analysis interface

#### Scenario: Invalid file format
- **WHEN** user uploads a file with unsupported extension (.txt)
- **THEN** system displays error message "Unsupported file format. Please upload CSV, Parquet, or GeoJSON files."
- **THEN** system remains in upload state without processing

#### Scenario: File size limit exceeded
- **WHEN** user uploads a file larger than 100MB
- **THEN** system displays error message "File too large. Maximum size is 100MB."
- **THEN** system remains in upload state without processing

### Requirement: Automatic format detection and schema inference
The system SHALL automatically detect file format and infer column schema including data types and null handling.

#### Scenario: CSV format detection (ACTUAL IMPLEMENTATION)
- **WHEN** user uploads a file with .csv extension
- **THEN** system detects format as CSV and parses with manual CSV parser
- **THEN** system handles quoted values, escaped quotes, and embedded newlines correctly
- **THEN** system infers column types (INTEGER, DOUBLE, VARCHAR, DATE) based on sample data
- **THEN** system shows detected schema in preview format

**Technical Implementation**:
- Manual CSV parsing instead of DuckDB blob URL reading
- Robust quoted value handling with escape sequence support
- Type inference from sample of first 10 non-empty values
- Fallback to VARCHAR for mixed or unrecognized types

#### Scenario: Parquet format detection
- **WHEN** user uploads a file with .parquet extension
- **THEN** system detects format as Parquet and extracts schema metadata
- **THEN** system displays column types and nullability information
- **THEN** system shows sample data preview

#### Scenario: GeoJSON format detection
- **WHEN** user uploads a file with .geojson extension
- **THEN** system detects format as GeoJSON and parses geometry data
- **THEN** system identifies geometry columns and properties
- **THEN** system shows spatial data preview with bounding box

### Requirement: Data preview and validation
The system SHALL provide data preview functionality to validate uploaded content before analysis.

#### Scenario: Data preview display
- **WHEN** file processing completes
- **THEN** system shows first 10 rows of data in tabular format
- **THEN** system displays row count and column count
- **THEN** system shows column names with inferred data types
- **THEN** system provides option to "Start Analysis" or "Upload Different File"

#### Scenario: Data validation errors
- **WHEN** file contains parsing errors or malformed data
- **THEN** system displays specific error messages with line numbers
- **THEN** system suggests corrective actions (e.g., "Check for inconsistent column counts")
- **THEN** system allows user to skip malformed rows or retry upload