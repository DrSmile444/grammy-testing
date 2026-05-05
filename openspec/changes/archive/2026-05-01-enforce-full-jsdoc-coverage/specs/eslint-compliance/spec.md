## MODIFIED Requirements

### Requirement: Every exported function and class has JSDoc

Every function, method, constructor, class declaration, and arrow function in `src/` SHALL have a JSDoc comment with a description sentence — including `private` and `protected` members. Every `@param` SHALL have a description. Every non-void function SHALL have `@returns`. This requirement is mechanically enforced by `jsdoc/require-jsdoc` with `MethodDefinition`, `ClassDeclaration`, `ArrowFunctionExpression`, and `FunctionExpression` all set to `true`.

#### Scenario: IDE hover docs on public API

- **WHEN** a consumer installs the package and hovers over an exported symbol in their IDE
- **THEN** the IDE displays a description of what the symbol does

#### Scenario: Param descriptions visible in IDE

- **WHEN** a consumer fills in arguments to an exported function
- **THEN** each parameter shows a description in the IDE tooltip

#### Scenario: Missing JSDoc on a class method triggers a lint error

- **WHEN** a developer adds a method to a class in `src/` without a JSDoc comment
- **THEN** `npm run lint` reports a `jsdoc/require-jsdoc` error on that method

#### Scenario: Missing JSDoc on a private method also triggers a lint error

- **WHEN** a developer adds a `private` method to a class in `src/` without a JSDoc comment
- **THEN** `npm run lint` reports a `jsdoc/require-jsdoc` error on that method
