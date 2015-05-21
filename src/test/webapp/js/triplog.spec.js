describe("Triplog", function() {
    var viewModel;
    beforeEach(function () {
        viewModel = new triplog.ViewModel();
    });

    it("viewModel defined", function () {
        expect(viewModel).toBeDefined();
    });
});