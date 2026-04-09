-- AuraFlow — Seed Data for Development
-- Replace [TEST-USER-UUID] and [RC-CLIENT-UUID] after creating test user in Supabase Auth

-- Create test user first: Authentication → Users → Create User → mo@auraflowusa.com

INSERT INTO client_profiles (user_id, client_id, business_name, contact_name, contact_email, contact_phone, industry, employee_count, revenue_range, complexity_score, foundation_score, hierarchy_depth, advisor_name, advisor_email)
VALUES ('[TEST-USER-UUID]', '[RC-CLIENT-UUID]', 'RC Generators & Electric', 'Robert Chen', 'robert@rcgenerators.com', '+1-951-555-0142', 'home_services', '6-15', '500k-1m', 22, 34, 5, 'Mo', 'mo@auraflowusa.com');

INSERT INTO lead_interactions (client_id, lead_name, lead_email, lead_phone, lead_location, source, service_type, estimated_value, lead_score, status, follow_up_stage, created_at) VALUES
('[RC-CLIENT-UUID]', 'Sarah Wilson', 'sarah.wilson@email.com', '+1-951-555-0201', 'Riverside, CA', 'google_ads', 'Panel Upgrade', 4200, 87, 'qualified', 2, now() - interval '2 hours'),
('[RC-CLIENT-UUID]', 'Mike Chen', 'mike.chen@email.com', '+1-909-555-0302', 'Corona, CA', 'angi', 'Generator Install', 8500, 72, 'new', 0, now() - interval '4 hours'),
('[RC-CLIENT-UUID]', 'Lisa Park', 'lisa.park@email.com', '+1-951-555-0403', 'Temecula, CA', 'organic', 'EV Charger Install', 3800, 65, 'contacted', 1, now() - interval '1 day'),
('[RC-CLIENT-UUID]', 'James Rodriguez', 'james.r@email.com', '+1-760-555-0504', 'Murrieta, CA', 'google_ads', 'Whole House Rewire', 12000, 91, 'booked', 3, now() - interval '2 days'),
('[RC-CLIENT-UUID]', 'Rachel Torres', 'rachel.t@email.com', '+1-951-555-0807', 'Perris, CA', 'lsa', 'Emergency Panel Repair', 2200, 95, 'new', 0, now() - interval '30 minutes');

INSERT INTO daily_metrics (client_id, date, leads_captured, leads_qualified, leads_booked, leads_won, avg_response_time_sec, cost_per_lead, ad_spend, ad_revenue, ad_roas, reviews_received, reviews_responded, avg_review_score, total_reviews, organic_traffic, keywords_ranking, admin_hours_saved, workflows_executed, foundation_score, pipeline_value) VALUES
('[RC-CLIENT-UUID]', CURRENT_DATE - 6, 3, 2, 1, 0, 18, 67.00, 201.00, 3500, 3.5, 1, 1, 4.7, 60, 38, 18, 2.0, 18, 36, 12200),
('[RC-CLIENT-UUID]', CURRENT_DATE - 5, 5, 3, 1, 1, 12, 54.00, 270.00, 4200, 4.1, 0, 0, 4.7, 60, 42, 18, 2.2, 22, 38, 15800),
('[RC-CLIENT-UUID]', CURRENT_DATE - 4, 2, 1, 0, 0, 22, 78.00, 156.00, 0, 0, 1, 1, 4.8, 61, 39, 19, 1.8, 15, 38, 11200),
('[RC-CLIENT-UUID]', CURRENT_DATE - 3, 9, 6, 3, 2, 5, 38.00, 342.00, 14200, 6.2, 1, 1, 4.8, 66, 61, 23, 3.2, 42, 46, 28500),
('[RC-CLIENT-UUID]', CURRENT_DATE - 2, 4, 3, 1, 0, 9, 55.00, 220.00, 4800, 4.5, 1, 1, 4.8, 67, 46, 23, 2.2, 24, 46, 17600),
('[RC-CLIENT-UUID]', CURRENT_DATE - 1, 6, 4, 2, 1, 7, 45.00, 270.00, 9200, 5.4, 1, 1, 4.9, 67, 53, 24, 2.6, 31, 48, 21800),
('[RC-CLIENT-UUID]', CURRENT_DATE, 4, 2, 1, 0, 8, 52.00, 208.00, 4200, 3.8, 1, 1, 4.9, 67, 47, 24, 2.1, 22, 48, 18700);

INSERT INTO agent_activity (client_id, agent_name, action, details, category, status, created_at) VALUES
('[RC-CLIENT-UUID]', 'maven', 'Lead captured — Emergency panel repair', 'Rachel Torres, Perris CA. $2,200 est. Score: 95.', 'lead', 'completed', now() - interval '30 minutes'),
('[RC-CLIENT-UUID]', 'orion', 'Follow-up #2 sent to Sarah Wilson', 'SMS: personalized panel upgrade inquiry.', 'lead', 'completed', now() - interval '1 hour'),
('[RC-CLIENT-UUID]', 'atlas', 'Review responded — 5-star', 'Auto-published positive review response.', 'review', 'completed', now() - interval '2 hours'),
('[RC-CLIENT-UUID]', 'maven', 'Ad budget optimization recommended', 'Shift 15% from generator to emergency — ROAS 6.2x vs 3.1x.', 'ad', 'pending_approval', now() - interval '3 hours'),
('[RC-CLIENT-UUID]', 'nova', 'Monthly revenue report generated', 'March revenue: $47,200. Top: Generator Install ($18,500).', 'financial', 'completed', now() - interval '5 hours'),
('[RC-CLIENT-UUID]', 'cyrus', 'System heartbeat — all nominal', '6 agents active. 0 errors. Uptime: 99.97%.', 'system', 'completed', now() - interval '12 hours');

INSERT INTO notifications (client_id, type, severity, title, body, read, created_at) VALUES
('[RC-CLIENT-UUID]', 'lead_hot', 'critical', 'Hot lead — Emergency panel repair', 'Rachel Torres, Perris CA. Score: 95. $2,200.', false, now() - interval '30 minutes'),
('[RC-CLIENT-UUID]', 'agent_action', 'high', 'Budget optimization needs approval', 'Maven: shift 15% to emergency campaign.', false, now() - interval '3 hours');

INSERT INTO hierarchy_nodes (client_id, layer_type, layer_position, node_name, is_active) VALUES
('[RC-CLIENT-UUID]', 'core_c1', 1, 'RC Generators & Electric', true),
('[RC-CLIENT-UUID]', 'ext_e4', 2, 'Residential Services', true),
('[RC-CLIENT-UUID]', 'ext_e5', 3, 'Generator Installation', true),
('[RC-CLIENT-UUID]', 'core_c2', 4, 'JOB-0142 Smith Residence', true),
('[RC-CLIENT-UUID]', 'core_c3', 5, 'Dispatch + 6hrs + $2,800', true);
