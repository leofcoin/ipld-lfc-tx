export default `// Leofcoin Transaction

message LFCOutput {
  required uint64 index = 1;
  required uint64 amount = 2;
  required string address = 3;
}

message LFCInput {
  required uint64 index = 1;
  required string tx = 2;
  required uint64 amount = 3;
  required string address = 4;
  required string signature = 5;
}

message LFCTransaction {
  required string id = 1;
  required uint64 time = 2;
  required string reward = 3;
  required string script = 4;
  repeated LFCInput inputs = 5;
  repeated LFCOutput outputs = 6;
}`
