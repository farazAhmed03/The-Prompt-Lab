

# Public-Facing Application Load Balancer
resource "aws_lb" "main_alb" {
  name               = "devops-project-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.my_own_sg.id]
  subnets            = data.aws_subnets.default.ids

  tags = {
    Name = "devops-project-alb"
  }
}

# Target Group (HTTPS:443 to match Nginx SSL Backend)
resource "aws_lb_target_group" "main_tg" {
  name                 = "devops-project-tg-https"
  port                 = 443
  protocol             = "HTTPS"
  vpc_id               = data.aws_vpc.default.id
  target_type          = "instance"
  deregistration_delay = 300

  health_check {
    enabled             = true
    protocol            = "HTTPS"
    port                = "traffic-port"
    path                = "/api/status"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 5
    unhealthy_threshold = 2
    matcher             = "200"
  }

  tags = {
    Name = "devops-project-tg-https"
  }
}

# Register Permanent Protected Main Server into Target Group
resource "aws_lb_target_group_attachment" "main_server" {
  target_group_arn = aws_lb_target_group.main_tg.arn
  target_id        = aws_instance.devops_server.id
  port             = 443
}

# HTTPS Listener (Port 443) with ACM SSL Certificate
resource "aws_lb_listener" "https_443" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate_validation.cert_validation.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main_tg.arn
  }
}

# HTTP Listener (Port 80) - Automatic 301 Redirect to HTTPS
resource "aws_lb_listener" "http_80" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
