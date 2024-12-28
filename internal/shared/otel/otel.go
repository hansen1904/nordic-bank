package otel

import (
	"context"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"
)

// InitExporters initializes the OTLP trace and metric exporters.
func InitExporters(ctx context.Context) (sdktrace.SpanExporter, sdkmetric.Exporter, error) {
	otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
	if otelEndpoint == "" {
		otelEndpoint = "localhost:4317"
	}

	traceExporter, err := otlptracegrpc.New(
		ctx,
		otlptracegrpc.WithEndpoint(otelEndpoint),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		return nil, nil, err
	}

	metricExporter, err := otlpmetricgrpc.New(
		ctx,
		otlpmetricgrpc.WithEndpoint(otelEndpoint),
		otlpmetricgrpc.WithInsecure(),
	)
	if err != nil {
		return nil, nil, err
	}

	return traceExporter, metricExporter, nil
}

// InitMeterProvider initializes the meter provider.
func InitMeterProvider(metricExporter sdkmetric.Exporter, resources *resource.Resource) *sdkmetric.MeterProvider {
	meterProvider := sdkmetric.NewMeterProvider(
		sdkmetric.WithReader(
			sdkmetric.NewPeriodicReader(metricExporter),
		),
		sdkmetric.WithResource(resources),
	)
	otel.SetMeterProvider(meterProvider)
	return meterProvider
}

// InitTelemetry initializes the trace and metric providers and returns shutdown functions.
func InitTelemetry(serviceName string, version string) (func(context.Context) error, func(context.Context) error, error) {
	ctx := context.Background()

	traceExporter, metricExporter, err := InitExporters(ctx)
	if err != nil {
		return nil, nil, err
	}

	resources := resource.NewWithAttributes(
		semconv.SchemaURL,
		semconv.ServiceNameKey.String(serviceName),
		semconv.ServiceVersionKey.String(version),
		semconv.TelemetrySDKLanguageGo,
	)

	tracerProvider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(traceExporter),
		sdktrace.WithResource(resources),
	)
	otel.SetTracerProvider(tracerProvider)

	meterProvider := InitMeterProvider(metricExporter, resources)

	return tracerProvider.Shutdown, meterProvider.Shutdown, nil
}
