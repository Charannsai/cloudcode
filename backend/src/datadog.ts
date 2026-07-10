import tracer from 'dd-trace';

tracer.init({
  logInjection: true, // Automatically inject dd.trace_id and dd.span_id into logs
});

export default tracer;
