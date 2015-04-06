CREATE DATABASE mailer13;

\c mailer13

CREATE TABLE users (
	id SERIAL NOT NULL,
	email VARCHAR(255),
	created TIMESTAMP NOT NULL,
	last_email_sent TIMESTAMP,
	sequence INT
);