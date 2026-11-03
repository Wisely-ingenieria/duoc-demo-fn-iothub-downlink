CREATE TABLE IF NOT EXISTS iot_data_test (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    deviceid text NOT NULL,
    data jsonb NOT NULL,
    meta_data jsonb NOT NULL,
    received_at timestamptz NOT NULL DEFAULT now()
);
