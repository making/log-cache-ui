package am.ik.lab;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
    @GetMapping(path = "/")
    public String home() {
        return "redirect:/index.html";
    }
}
