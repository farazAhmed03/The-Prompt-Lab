
# Spot Auto Scaling Group ( for cost-optimization )
resource "aws_autoscaling_group" "spot_asg" {
  name                      = "devops-project-asg"
  vpc_zone_identifier       = data.aws_subnets.default.ids
  target_group_arns         = [aws_lb_target_group.main_tg.arn]
  min_size                  = 0
  max_size                  = 2
  desired_capacity          = 0
  health_check_type         = "ELB"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.spot_lt.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "devops-project-spot-worker"
    propagate_at_launch = true
  }
}


# Scale-Out Policy & High CPU Alarm (+1 Spot Instance when CPU > 80%)
resource "aws_autoscaling_policy" "scale_out" {
  name                   = "scale-out-high-cpu"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 60
  autoscaling_group_name = aws_autoscaling_group.spot_asg.name
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "devops-project-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggers when Main Server CPU exceeds 80% for 1 minute"

  dimensions = {
    InstanceId = aws_instance.devops_server.id
  }

  alarm_actions = [
    aws_autoscaling_policy.scale_out.arn,
    var.sns_topic_arn
  ]
}

# Scale-In Policy & Low CPU Alarm (-1 Spot Instance when CPU <= 30%)
resource "aws_autoscaling_policy" "scale_in" {
  name                   = "scale-in-low-cpu"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 60
  autoscaling_group_name = aws_autoscaling_group.spot_asg.name
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "devops-project-low-cpu-alarm"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 30
  alarm_description   = "Triggers when Main Server CPU is below 30% to drain & terminate Spot instances"

  dimensions = {
    InstanceId = aws_instance.devops_server.id
  }

  alarm_actions = [
    aws_autoscaling_policy.scale_in.arn,
    var.sns_topic_arn
  ]
}

