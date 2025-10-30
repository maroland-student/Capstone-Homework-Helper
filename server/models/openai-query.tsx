// Defines properties that can be included in an OpenAI query

// Based on OpenAI Platform documentation:
// https://platform.openai.com/docs/api-reference/responses/create
// https://platform.openai.com/docs/guides/text?api-mode=responses#reusable-prompts

export interface openAIQueryParams{
    background?: boolean,            // Can this model response run in the background?
    conversation?: any,              // The conversation that this response belongs to.
    include?: any,                   // Specify additional output data to include in the model response. See documentation for values
    input?: any,                     // Text, image or file input for the model to use. See documentation
    instructions?: string,           // Model context for the query
    max_output_tokens?: number,      // Integer value, upper bound for tokens that can be used in output
    max_tool_calls?: number,         // Integer value for the maximum total calls that can be processed in a response
    model?: string,                  // Which model to use? example 'gpt-4o'
    parallel_tool_calls?: boolean,   // Can the model run tool in parallel?
    previous_response_id?: string,   // Unique ID of the previous response to the model. Used for multi-turn conversations
    prompt?: Object,                 // Prompt template to use. See documentation for structure
    prompt_cache_key?: string,       // Used by OpenAI to cache responses for similar requests to optimize your cache hit rates. 
    reasoning?: Object,              // A summary of the reasoning performed by the model. See documentation for structure
    safety_identifier?: string,      // A stable identifier used to help detect users of your application that may be violating OpenAI's usage policies 
    service_tier?: string,           // Specifies the processing type used for serving the request.
    store?: boolean,                 // Should the API store the response for later retrieval? 
    stream?: boolean,                // Should the emodel response data be streamed in?
    stream_options?: Object,         // Options for streaming responses when stream = true. See documentation for structure
    temperature?: Number,            // Sampling temperature between 0 and 2
    text?: Object,                   // Configuration options for text response from the model. See documentation for structure
    tool_choice?: any,               // How th emodel should select which tool to use when generating response
    tools?: Array<any>,              // Array of tools the model may call while generating a response.
    top_logprobs?: Number,           // Integer between 0 and 20 specifying the most likely tokens to return at each position
    top_p?: Number,                  // Default is 1. Alternative to 'temperature', not recommended to use with temperature
    truncation?: string,             // 'auto' or 'default'
}