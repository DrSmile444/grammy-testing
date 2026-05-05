# OutgoingRequests (API Reference)

```ts
class OutgoingRequests<TMethod extends RealApiMethodKeys = RealApiMethodKeys>
```

## Type aliases

```ts
type RealApiMethodKeys = Methods; // union of all grammY API method names
```

## Request interface

```ts
interface Request<TMethod extends Methods = Methods> {
  method: TMethod;
  payload: Payload<TMethod>;
  signal?: AbortSignal;
}
```

## Properties

| Property   | Type                 | Description                    |
| ---------- | -------------------- | ------------------------------ |
| `requests` | `readonly Request[]` | All captured requests in order |
| `length`   | `number`             | Count of captured requests     |

## Capture accessors

| Method                   | Signature                                          | Description                             |
| ------------------------ | -------------------------------------------------- | --------------------------------------- |
| `getMethods`             | `() => TMethod[]`                                  | Method names in capture order           |
| `getFirst<T>`            | `() => Request<T> \| null`                         | First request                           |
| `getLast<T>`             | `() => Request<T> \| null`                         | Last request                            |
| `getTwoLast<T1,T2>`      | `() => [Request<T1>?, Request<T2>?]`               | Last two, oldest first                  |
| `getThreeLast<T1,T2,T3>` | `() => [Request<T1>?, Request<T2>?, Request<T3>?]` | Last three                              |
| `getAll<T1,...>`         | 10 overloads returning typed tuple                 | Full store as typed tuple               |
| `buildMethods<T>`        | `(methods: T[]) => T[]`                            | Identity helper for typed method arrays |

## Mutation

| Method  | Signature                                   | Description                  |
| ------- | ------------------------------------------- | ---------------------------- |
| `push`  | `(...requests: Request<TMethod>[]) => this` | Append requests              |
| `clear` | `() => this`                                | Remove all captured requests |

## Error simulation

| Method           | Signature                                                 | Description                              |
| ---------------- | --------------------------------------------------------- | ---------------------------------------- |
| `failNext`       | `(method, error: GrammyError \| GrammyErrorSpec) => this` | Next call to method rejects once         |
| `failAll`        | `(method, error: GrammyError \| GrammyErrorSpec) => this` | Every call to method rejects             |
| `respondNext`    | `(method, payload: unknown) => this`                      | Next call returns custom payload         |
| `clearOverrides` | `() => this`                                              | Remove all one-shot and sticky overrides |

## getAll overloads

```ts
getAll<T1>(): [Request<T1>?]
getAll<T1, T2>(): [Request<T1>?, Request<T2>?]
getAll<T1, T2, T3>(): [Request<T1>?, Request<T2>?, Request<T3>?]
// ... up to 10 type arguments
```

## See also

- [Outgoing Requests guide](/low-level/outgoing-requests)
